/* Copyright (c) 2025 Richard Rodger, MIT License */

package aontu

import (
	"fmt"
	"strconv"
	"strings"
)

// The parser is a hand-written recursive-descent parser for the core
// Aontu surface syntax (a JSON superset). The canonical parser is the
// jsonic-based grammar in ts/src/lang.ts; this implementation covers
// the subset needed by the shared spec:
//
//   - scalars: integer, number, string (bare or quoted), boolean, null
//   - type kinds: string, number, integer, boolean, top, nil
//   - maps: braces {a:1}, implicit nesting a:b:1, duplicate-key merge
//   - lists: [1,2,3]
//   - operators: & (conjunct), | (disjunct), * (preference/default)
//   - comments: # to end of line
//
// Separators between map pairs and list elements may be commas,
// newlines or whitespace.

type tokKind int

const (
	tEOF tokKind = iota
	tLBrace
	tRBrace
	tLBrack
	tRBrack
	tColon
	tAmp
	tPipe
	tStar
	tString // quoted string -> always a string value
	tText   // bare word -> keyword or string value
	tNumber
)

type token struct {
	kind  tokKind
	val   string
	pos   int
	isInt bool
}

func isTextStart(c byte) bool {
	return c == '_' || (c >= 'A' && c <= 'Z') || (c >= 'a' && c <= 'z')
}

func isTextCont(c byte) bool {
	return isTextStart(c) || (c >= '0' && c <= '9') || c == '-'
}

func lexAll(src string) ([]token, error) {
	var toks []token
	i := 0
	n := len(src)
	for i < n {
		c := src[i]

		// Trivia: whitespace, commas and # comments are separators.
		if c == ' ' || c == '\t' || c == '\r' || c == '\n' || c == ',' {
			i++
			continue
		}
		if c == '#' {
			for i < n && src[i] != '\n' {
				i++
			}
			continue
		}

		start := i
		switch c {
		case '{':
			toks = append(toks, token{tLBrace, "{", start, false})
			i++
		case '}':
			toks = append(toks, token{tRBrace, "}", start, false})
			i++
		case '[':
			toks = append(toks, token{tLBrack, "[", start, false})
			i++
		case ']':
			toks = append(toks, token{tRBrack, "]", start, false})
			i++
		case ':':
			toks = append(toks, token{tColon, ":", start, false})
			i++
		case '&':
			toks = append(toks, token{tAmp, "&", start, false})
			i++
		case '|':
			toks = append(toks, token{tPipe, "|", start, false})
			i++
		case '*':
			toks = append(toks, token{tStar, "*", start, false})
			i++
		case '"', '\'':
			s, ni, err := lexString(src, i)
			if err != nil {
				return nil, err
			}
			toks = append(toks, token{tString, s, start, false})
			i = ni
		default:
			// Number: a digit, or a sign immediately followed by a digit.
			if (c >= '0' && c <= '9') ||
				((c == '-' || c == '+') && i+1 < n && src[i+1] >= '0' && src[i+1] <= '9') {
				raw, isInt, ni := lexNumber(src, i)
				toks = append(toks, token{tNumber, raw, start, isInt})
				i = ni
				continue
			}
			// Bare word.
			if isTextStart(c) {
				j := i + 1
				for j < n && isTextCont(src[j]) {
					j++
				}
				toks = append(toks, token{tText, src[start:j], start, false})
				i = j
				continue
			}
			return nil, &AontuError{Msg: fmt.Sprintf("unexpected character %q at %d", string(c), i)}
		}
	}
	toks = append(toks, token{tEOF, "", n, false})
	return toks, nil
}

func lexString(src string, i int) (string, int, error) {
	q := src[i]
	i++
	n := len(src)
	var b strings.Builder
	for i < n {
		c := src[i]
		if c == q {
			return b.String(), i + 1, nil
		}
		if c == '\\' && i+1 < n {
			i++
			switch src[i] {
			case 'n':
				b.WriteByte('\n')
			case 't':
				b.WriteByte('\t')
			case 'r':
				b.WriteByte('\r')
			default:
				b.WriteByte(src[i])
			}
			i++
			continue
		}
		b.WriteByte(c)
		i++
	}
	return "", i, &AontuError{Msg: "unterminated string"}
}

func lexNumber(src string, i int) (string, bool, int) {
	n := len(src)
	start := i
	if i < n && (src[i] == '-' || src[i] == '+') {
		i++
	}
	hasDot := false
	hasExp := false
	for i < n {
		c := src[i]
		if c >= '0' && c <= '9' {
			i++
		} else if c == '.' && !hasDot && !hasExp {
			hasDot = true
			i++
		} else if (c == 'e' || c == 'E') && !hasExp {
			hasExp = true
			i++
			if i < n && (src[i] == '-' || src[i] == '+') {
				i++
			}
		} else {
			break
		}
	}
	// Mirrors ts/src/lang.ts: a number is an integer when its source
	// has no decimal point.
	return src[start:i], !hasDot, i
}

type parser struct {
	toks []token
	i    int
}

// parse parses source into a (not yet unified) Val.
func parse(src string) (Val, error) {
	toks, err := lexAll(src)
	if err != nil {
		return newMap(), err
	}
	p := &parser{toks: toks}
	return p.parseTop()
}

func (p *parser) cur() token { return p.toks[p.i] }

func (p *parser) peek(n int) token {
	j := p.i + n
	if j >= len(p.toks) {
		return p.toks[len(p.toks)-1]
	}
	return p.toks[j]
}

func (p *parser) next() token { t := p.toks[p.i]; p.i++; return t }

func (p *parser) isKeyTok(t token) bool {
	return t.kind == tText || t.kind == tString || t.kind == tNumber
}

func (p *parser) isPairAhead() bool {
	return p.isKeyTok(p.cur()) && p.peek(1).kind == tColon
}

func keyString(t token) string { return t.val }

func (p *parser) parseTop() (Val, error) {
	if p.cur().kind == tEOF {
		return newMap(), nil
	}
	if p.isPairAhead() {
		return p.parseMapBody(tEOF)
	}
	return p.parseValue()
}

func (p *parser) parseMapBody(end tokKind) (Val, error) {
	m := newMap()
	for p.cur().kind != end && p.cur().kind != tEOF {
		if !p.isKeyTok(p.cur()) {
			return m, &AontuError{Msg: "expected key at " + strconv.Itoa(p.cur().pos)}
		}
		keyTok := p.next()
		key := keyString(keyTok)
		if p.cur().kind != tColon {
			return m, &AontuError{Msg: "expected ':' after key " + key}
		}
		p.next() // ':'
		val, err := p.parseValue()
		if err != nil {
			return m, err
		}
		m.add(key, val)
	}
	return m, nil
}

func (p *parser) parseValue() (Val, error) {
	// Implicit nested map: a single pair chain, e.g. a:b:c:1.
	if p.isPairAhead() {
		pos := p.cur().pos
		keyTok := p.next()
		key := keyString(keyTok)
		p.next() // ':'
		inner, err := p.parseValue()
		if err != nil {
			return nil, err
		}
		m := newMap()
		m.add(key, inner)
		m.sp = pos
		return m, nil
	}
	return p.parseDisjunct()
}

func (p *parser) parseDisjunct() (Val, error) {
	left, err := p.parseConjunct()
	if err != nil {
		return nil, err
	}
	if p.cur().kind != tPipe {
		return left, nil
	}
	members := []Val{left}
	pos := left.pos()
	for p.cur().kind == tPipe {
		p.next()
		m, err := p.parseConjunct()
		if err != nil {
			return nil, err
		}
		members = append(members, m)
	}
	d := newDisjunct(members)
	d.sp = pos
	return d, nil
}

func (p *parser) parseConjunct() (Val, error) {
	left, err := p.parseUnary()
	if err != nil {
		return nil, err
	}
	if p.cur().kind != tAmp {
		return left, nil
	}
	terms := []Val{left}
	pos := left.pos()
	for p.cur().kind == tAmp {
		p.next()
		t, err := p.parseUnary()
		if err != nil {
			return nil, err
		}
		terms = append(terms, t)
	}
	c := newConjunct(terms)
	c.sp = pos
	return c, nil
}

func (p *parser) parseUnary() (Val, error) {
	if p.cur().kind == tStar {
		pos := p.cur().pos
		p.next()
		inner, err := p.parseUnary()
		if err != nil {
			return nil, err
		}
		pv := newPref(inner)
		pv.sp = pos
		return pv, nil
	}
	return p.parsePrimary()
}

func (p *parser) parsePrimary() (Val, error) {
	t := p.cur()
	switch t.kind {
	case tLBrace:
		return p.parseBraceMap()
	case tLBrack:
		return p.parseList()
	case tString:
		p.next()
		v := newString(t.val)
		v.sp = t.pos
		return v, nil
	case tNumber:
		p.next()
		f, _ := strconv.ParseFloat(t.val, 64)
		var v Val
		if t.isInt {
			v = newInteger(int64(f))
		} else {
			v = newNumber(f)
		}
		v.setPos(t.pos)
		return v, nil
	case tText:
		p.next()
		v := keywordOrString(t.val)
		if _, ok := v.(*TopVal); !ok {
			v.setPos(t.pos)
		}
		return v, nil
	}
	return nil, &AontuError{Msg: "unexpected token '" + t.val + "' at " + strconv.Itoa(t.pos)}
}

func (p *parser) parseBraceMap() (Val, error) {
	pos := p.cur().pos
	p.next() // {
	m, err := p.parseMapBody(tRBrace)
	if err != nil {
		return m, err
	}
	if p.cur().kind != tRBrace {
		return m, &AontuError{Msg: "expected '}'"}
	}
	p.next() // }
	if mv, ok := m.(*MapVal); ok {
		mv.sp = pos
	}
	return m, nil
}

func (p *parser) parseList() (Val, error) {
	pos := p.cur().pos
	p.next() // [
	var elems []Val
	for p.cur().kind != tRBrack && p.cur().kind != tEOF {
		e, err := p.parseDisjunct()
		if err != nil {
			return nil, err
		}
		elems = append(elems, e)
	}
	if p.cur().kind != tRBrack {
		return nil, &AontuError{Msg: "expected ']'"}
	}
	p.next() // ]
	l := newList(elems)
	l.sp = pos
	return l, nil
}

func keywordOrString(s string) Val {
	switch s {
	case "true":
		return newBoolean(true)
	case "false":
		return newBoolean(false)
	case "null":
		return newNull()
	case "nil":
		return newNil("literal_nil")
	case "top":
		return top()
	case "string":
		return newScalarKind(KindString)
	case "number":
		return newScalarKind(KindNumber)
	case "integer":
		return newScalarKind(KindInteger)
	case "boolean":
		return newScalarKind(KindBoolean)
	}
	return newString(s)
}
