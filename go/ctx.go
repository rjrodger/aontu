/* Copyright (c) 2021-2025 Richard Rodger, MIT License */

package aontu

// AontuContext holds execution state for unification.
type AontuContext struct {
	root    Val
	path    []string
	vc      int
	cc      int
	sc      int // unresolved spread count
	vars    map[string]Val
	src     string
	collect bool
	err     []*NilVal
	explain []interface{}
	srcpath string
	deps    map[string]interface{}
	opts    *AontuOptions

	trialMode bool
	seen      map[string]int

	// Caches
	pathmap     map[string]int
	pathTrie    map[int]map[string]*pathTrieEntry
	pathidxNext *int
	pathidx     int
	childCache  map[string]*AontuContext
}

type pathTrieEntry struct {
	idx  int
	path []string
}

// AontuOptions configures the engine.
type AontuOptions struct {
	Src     string
	Collect bool
	Err     []*NilVal
	Explain []interface{}
	Debug   bool
}

func NewAontuContext(opts *AontuOptions) *AontuContext {
	pidxNext := 1
	ctx := &AontuContext{
		path:        []string{},
		vc:          1_000_000_000,
		cc:          -1,
		vars:        make(map[string]Val),
		err:         []*NilVal{},
		seen:        make(map[string]int),
		deps:        make(map[string]interface{}),
		pathmap:     make(map[string]int),
		pathTrie:    make(map[int]map[string]*pathTrieEntry),
		pathidxNext: &pidxNext,
		pathidx:     0,
	}
	if opts != nil {
		ctx.opts = opts
		ctx.src = opts.Src
		ctx.collect = opts.Collect
		if opts.Err != nil {
			ctx.err = opts.Err
			ctx.collect = true
		}
		if opts.Explain != nil {
			ctx.explain = opts.Explain
		}
	}
	return ctx
}

// Clone creates a shallow copy with optional overrides.
func (ctx *AontuContext) Clone(overrides *AontuContext) *AontuContext {
	c := *ctx // struct copy
	if overrides != nil {
		if overrides.root != nil {
			c.root = overrides.root
		}
		if overrides.path != nil {
			c.path = overrides.path
		}
		if overrides.err != nil {
			c.err = overrides.err
		}
		if overrides.explain != nil {
			c.explain = overrides.explain
		}
	}
	c.childCache = nil
	return &c
}

// Descend creates a child context for a deeper path key.
func (ctx *AontuContext) Descend(key string) *AontuContext {
	// Check cache
	if ctx.childCache != nil {
		if cached, ok := ctx.childCache[key]; ok {
			return cached
		}
	} else {
		ctx.childCache = make(map[string]*AontuContext)
	}

	child := *ctx // struct copy
	child.childCache = nil

	// Use trie for path and pathidx
	parentIdx := ctx.pathidx
	childMap, ok := ctx.pathTrie[parentIdx]
	if !ok {
		childMap = make(map[string]*pathTrieEntry)
		ctx.pathTrie[parentIdx] = childMap
	}
	entry, ok := childMap[key]
	if !ok {
		newPath := make([]string, len(ctx.path)+1)
		copy(newPath, ctx.path)
		newPath[len(ctx.path)] = key
		entry = &pathTrieEntry{
			idx:  *ctx.pathidxNext,
			path: newPath,
		}
		*ctx.pathidxNext++
		childMap[key] = entry
	}
	child.pathidx = entry.idx
	child.path = entry.path

	ctx.childCache[key] = &child
	return &child
}

func (ctx *AontuContext) AddErr(err *NilVal) {
	if err != nil {
		ctx.err = append(ctx.err, err)
	}
}
