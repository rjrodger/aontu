/* Copyright (c) 2025 Richard Rodger, MIT License */

package lsp

import "encoding/json"

// Version is reported to the client in the initialize response.
const Version = "0.1.0"

// Message is an incoming JSON-RPC message (request or notification). ID
// is kept raw because JSON-RPC ids may be either a number or a string;
// notifications omit it.
type Message struct {
	JSONRPC string          `json:"jsonrpc"`
	ID      json.RawMessage `json:"id,omitempty"`
	Method  string          `json:"method,omitempty"`
	Params  json.RawMessage `json:"params,omitempty"`
}

// Out is an outgoing JSON-RPC message. Result uses json.RawMessage so a
// success response can carry an explicit `null` (omitempty drops only a
// genuinely absent result, e.g. on notifications and error responses).
type Out struct {
	JSONRPC string          `json:"jsonrpc"`
	ID      json.RawMessage `json:"id,omitempty"`
	Method  string          `json:"method,omitempty"`
	Params  json.RawMessage `json:"params,omitempty"`
	Result  json.RawMessage `json:"result,omitempty"`
	Error   *RespError      `json:"error,omitempty"`
}

// RespError is a JSON-RPC error object.
type RespError struct {
	Code    int    `json:"code"`
	Message string `json:"message"`
}

func newResponse(id json.RawMessage, result any) Out {
	raw, err := json.Marshal(result) // nil result marshals to "null"
	if err != nil {
		raw = []byte("null")
	}
	return Out{JSONRPC: "2.0", ID: id, Result: raw}
}

func newError(id json.RawMessage, code int, msg string) Out {
	return Out{JSONRPC: "2.0", ID: id, Error: &RespError{Code: code, Message: msg}}
}

func newNotification(method string, params any) Out {
	raw, err := json.Marshal(params)
	if err != nil {
		raw = []byte("null")
	}
	return Out{JSONRPC: "2.0", Method: method, Params: raw}
}

// Handler implements the Aontu LSP message flow without any transport: it
// consumes decoded Messages and returns the Outs to send back. It tracks
// open document text and recomputes diagnostics on open/change/close. A
// single Handler is not safe for concurrent use; drive it from one
// goroutine (as the stdio server does).
type Handler struct {
	docs       map[string]string
	shutdownOK bool
	exit       bool
}

// NewHandler returns a ready Handler with no open documents.
func NewHandler() *Handler {
	return &Handler{docs: map[string]string{}}
}

// ShouldExit reports whether an `exit` notification has been received and
// the server loop should stop.
func (h *Handler) ShouldExit() bool { return h.exit }

// ExitCode is the process exit code per the LSP spec: 0 if `shutdown`
// preceded `exit`, otherwise 1.
func (h *Handler) ExitCode() int {
	if h.shutdownOK {
		return 0
	}
	return 1
}

// Doc returns the current text of an open document and whether it is open.
func (h *Handler) Doc(uri string) (string, bool) {
	t, ok := h.docs[uri]
	return t, ok
}

// Handle processes one incoming message and returns zero or more messages
// to send. Notifications produce only notifications (e.g.
// publishDiagnostics); requests produce exactly one response.
func (h *Handler) Handle(m Message) []Out {
	switch m.Method {
	case "initialize":
		return []Out{newResponse(m.ID, initializeResult())}

	case "initialized":
		return nil

	case "shutdown":
		h.shutdownOK = true
		return []Out{newResponse(m.ID, nil)} // result: null

	case "exit":
		h.exit = true
		return nil

	case "textDocument/didOpen":
		var p struct {
			TextDocument struct {
				URI  string `json:"uri"`
				Text string `json:"text"`
			} `json:"textDocument"`
		}
		if err := json.Unmarshal(m.Params, &p); err != nil {
			return nil
		}
		h.docs[p.TextDocument.URI] = p.TextDocument.Text
		return []Out{h.publish(p.TextDocument.URI)}

	case "textDocument/didChange":
		var p struct {
			TextDocument struct {
				URI string `json:"uri"`
			} `json:"textDocument"`
			ContentChanges []struct {
				Text string `json:"text"`
			} `json:"contentChanges"`
		}
		if err := json.Unmarshal(m.Params, &p); err != nil || len(p.ContentChanges) == 0 {
			return nil
		}
		// Full document sync: the last change holds the entire new text.
		h.docs[p.TextDocument.URI] = p.ContentChanges[len(p.ContentChanges)-1].Text
		return []Out{h.publish(p.TextDocument.URI)}

	case "textDocument/didClose":
		var p struct {
			TextDocument struct {
				URI string `json:"uri"`
			} `json:"textDocument"`
		}
		if err := json.Unmarshal(m.Params, &p); err != nil {
			return nil
		}
		delete(h.docs, p.TextDocument.URI)
		// Clear diagnostics for the closed document.
		return []Out{publishDiagnosticsMsg(p.TextDocument.URI, []Diagnostic{})}

	case "textDocument/hover":
		var p struct {
			TextDocument struct {
				URI string `json:"uri"`
			} `json:"textDocument"`
			Position struct {
				Line      int `json:"line"`
				Character int `json:"character"`
			} `json:"position"`
		}
		if err := json.Unmarshal(m.Params, &p); err != nil {
			return []Out{newResponse(m.ID, nil)}
		}
		text, ok := h.docs[p.TextDocument.URI]
		if !ok {
			return []Out{newResponse(m.ID, nil)}
		}
		return []Out{newResponse(m.ID, Hover(text, p.Position.Line, p.Position.Character))}

	case "textDocument/completion":
		return []Out{newResponse(m.ID, Completions())}

	default:
		// Unknown request (has an id): reply method-not-found. Unknown
		// notification: ignore.
		if len(m.ID) > 0 {
			return []Out{newError(m.ID, -32601, "method not found: "+m.Method)}
		}
		return nil
	}
}

// publish computes and wraps diagnostics for an open document.
func (h *Handler) publish(uri string) Out {
	return publishDiagnosticsMsg(uri, Diagnostics(h.docs[uri]))
}

func publishDiagnosticsMsg(uri string, diags []Diagnostic) Out {
	return newNotification("textDocument/publishDiagnostics", map[string]any{
		"uri":         uri,
		"diagnostics": diags,
	})
}

// initializeResult advertises the server capabilities: full-text document
// sync (open/change/close) feeding diagnostics.
func initializeResult() map[string]any {
	return map[string]any{
		"capabilities": map[string]any{
			// 1 = TextDocumentSyncKind.Full
			"textDocumentSync":   1,
			"hoverProvider":      true,
			"completionProvider": map[string]any{},
		},
		"serverInfo": map[string]any{
			"name":    "aontu-lsp",
			"version": Version,
		},
	}
}
