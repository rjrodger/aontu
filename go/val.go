/* Copyright (c) 2021-2025 Richard Rodger, MIT License */

package aontu

import (
	"fmt"
	"strings"
	"sync/atomic"
)

// DONE marks a Val as fully resolved.
const DONE = -1

// Global Val ID counter.
var globalID int64 = 1000

func nextID() int {
	return int(atomic.AddInt64(&globalID, 1))
}

// ScalarKind represents the type of a scalar value.
type ScalarKind int

const (
	KindString  ScalarKind = iota
	KindNumber
	KindInteger
	KindBoolean
	KindNull
)

func (k ScalarKind) String() string {
	switch k {
	case KindString:
		return "string"
	case KindNumber:
		return "number"
	case KindInteger:
		return "integer"
	case KindBoolean:
		return "boolean"
	case KindNull:
		return "null"
	default:
		return "unknown"
	}
}

// Site tracks source location.
type Site struct {
	Row int
	Col int
	URL string
}

// ValMark holds boolean flags for type and hide marks.
type ValMark struct {
	Type bool
	Hide bool
}

// ValSpec is the specification used to construct a Val.
type ValSpec struct {
	Peg      interface{}
	Mark     *ValMark
	Kind     ScalarKind
	Row      int
	Col      int
	URL      string
	Path     []string
	ID       int
	Src      string
	Why      string
	Msg      string
	Absolute bool
	Prefix   bool
}

// Val is the core interface for all value types in aontu.
type Val interface {
	GetID() int
	GetDC() int
	SetDC(int)
	Done() bool
	GetPath() []string
	SetPath([]string)
	GetSite() *Site
	SetSite(*Site)
	GetMark() *ValMark
	GetPeg() interface{}
	SetPeg(interface{})
	GetErr() []*NilVal
	SetErr([]*NilVal)

	Unify(peer Val, ctx *AontuContext) Val
	Gen(ctx *AontuContext) (interface{}, error)
	Clone(ctx *AontuContext, spec *ValSpec) Val
	SpreadClone(ctx *AontuContext) Val
	Canon() string
	Same(peer Val) bool
	Superior() Val
	Place(v Val) Val
	NotDone()

	// Type discrimination — false on ValBase, overridden per concrete type.
	IsTop() bool
	IsNil() bool
	IsMap() bool
	IsList() bool
	IsScalar() bool
	IsScalarKind() bool
	IsPath() bool
	IsPref() bool
	IsVar() bool
	IsBag() bool
	IsSpread() bool
	IsNumber() bool
	IsInteger() bool
	IsString() bool
	IsBoolean() bool
	IsConjunct() bool
	IsDisjunct() bool
	IsJunction() bool
	IsOp() bool
	IsFunc() bool
	IsGenable() bool
	IsExpect() bool
	IsPathDependent() bool
	IsFeature() bool

	CJO() int
}

// ValBase provides default implementations for the Val interface.
// All concrete Val types embed this.
type ValBase struct {
	id   int
	dc   int
	path []string
	site *Site
	mark ValMark
	peg  interface{}
	err  []*NilVal
}

func NewValBase(spec *ValSpec) ValBase {
	vb := ValBase{
		id:   nextID(),
		dc:   0,
		path: []string{},
	}
	if spec != nil {
		vb.peg = spec.Peg
		if spec.Path != nil {
			vb.path = spec.Path
		}
		if spec.Mark != nil {
			vb.mark.Type = spec.Mark.Type
			vb.mark.Hide = spec.Mark.Hide
		}
	}
	return vb
}

// --- Val interface: getters/setters ---

func (v *ValBase) GetID() int              { return v.id }
func (v *ValBase) GetDC() int              { return v.dc }
func (v *ValBase) SetDC(dc int)            { v.dc = dc }
func (v *ValBase) Done() bool              { return v.dc == DONE }
func (v *ValBase) GetPath() []string       { return v.path }
func (v *ValBase) SetPath(p []string)      { v.path = p }
func (v *ValBase) GetPeg() interface{}     { return v.peg }
func (v *ValBase) SetPeg(p interface{})    { v.peg = p }
func (v *ValBase) GetErr() []*NilVal       { return v.err }
func (v *ValBase) SetErr(e []*NilVal)      { v.err = e }

func (v *ValBase) GetSite() *Site {
	if v.site == nil {
		v.site = &Site{Row: -1, Col: -1}
	}
	return v.site
}

func (v *ValBase) SetSite(s *Site) { v.site = s }

func (v *ValBase) GetMark() *ValMark { return &v.mark }

// --- Val interface: defaults ---

func (v *ValBase) Same(peer Val) bool {
	if peer == nil {
		return false
	}
	return v.id == peer.GetID()
}

func (v *ValBase) NotDone() {
	if v.dc != DONE {
		v.dc++
	}
}

func (v *ValBase) Place(target Val) Val {
	s := v.GetSite()
	ts := target.GetSite()
	ts.Row = s.Row
	ts.Col = s.Col
	ts.URL = s.URL
	return target
}

// Default Unify returns self.
func (v *ValBase) Unify(_ Val, _ *AontuContext) Val { return nil }

// Default Gen returns nil.
func (v *ValBase) Gen(_ *AontuContext) (interface{}, error) { return nil, nil }

// Default Clone panics — must be overridden by concrete types.
func (v *ValBase) Clone(_ *AontuContext, _ *ValSpec) Val {
	panic("Clone not implemented for ValBase")
}

// Default SpreadClone delegates to Clone.
func (v *ValBase) SpreadClone(ctx *AontuContext) Val {
	return nil // overridden by concrete types
}

func (v *ValBase) Canon() string { return "" }

func (v *ValBase) Superior() Val { return top() }

// --- Type discrimination: all false by default ---

func (v *ValBase) IsTop() bool           { return false }
func (v *ValBase) IsNil() bool           { return false }
func (v *ValBase) IsMap() bool           { return false }
func (v *ValBase) IsList() bool          { return false }
func (v *ValBase) IsScalar() bool        { return false }
func (v *ValBase) IsScalarKind() bool    { return false }
func (v *ValBase) IsPath() bool          { return false }
func (v *ValBase) IsPref() bool          { return false }
func (v *ValBase) IsVar() bool           { return false }
func (v *ValBase) IsBag() bool           { return false }
func (v *ValBase) IsSpread() bool        { return false }
func (v *ValBase) IsNumber() bool        { return false }
func (v *ValBase) IsInteger() bool       { return false }
func (v *ValBase) IsString() bool        { return false }
func (v *ValBase) IsBoolean() bool       { return false }
func (v *ValBase) IsConjunct() bool      { return false }
func (v *ValBase) IsDisjunct() bool      { return false }
func (v *ValBase) IsJunction() bool      { return false }
func (v *ValBase) IsOp() bool            { return false }
func (v *ValBase) IsFunc() bool          { return false }
func (v *ValBase) IsGenable() bool       { return false }
func (v *ValBase) IsExpect() bool        { return false }
func (v *ValBase) IsFeature() bool       { return false }
func (v *ValBase) CJO() int              { return 99999 }

func (v *ValBase) IsPathDependent() bool { return false }

// --- TopVal: the universal identity element ---

// TopVal represents the top/unit element of the lattice.
// Unifying anything with Top returns the other value.
type TopVal struct {
	ValBase
}

var topInstance *TopVal

func top() *TopVal {
	if topInstance == nil {
		topInstance = &TopVal{
			ValBase: ValBase{
				id: 0,
				dc: DONE,
			},
		}
	}
	return topInstance
}

func (v *TopVal) IsTop() bool    { return true }
func (v *TopVal) Done() bool     { return true }
func (v *TopVal) Canon() string  { return "top" }
func (v *TopVal) Same(peer Val) bool {
	if peer == nil {
		return false
	}
	return peer.IsTop()
}

func (v *TopVal) Unify(peer Val, _ *AontuContext) Val {
	if peer == nil {
		return v
	}
	return peer
}

func (v *TopVal) Gen(_ *AontuContext) (interface{}, error) {
	return nil, nil
}

func (v *TopVal) Clone(_ *AontuContext, _ *ValSpec) Val {
	return v // singleton
}

func (v *TopVal) SpreadClone(_ *AontuContext) Val {
	return v
}

func (v *TopVal) Superior() Val { return v }

// --- Helpers ---

func canonPath(path []string) string {
	return strings.Join(path, ".")
}

func formatVal(v Val) string {
	if v == nil {
		return "<nil>"
	}
	return fmt.Sprintf("<%T/%d>", v, v.GetID())
}

// isValNil checks if a Val interface value is nil or wraps a nil pointer.
func isValNil(v Val) bool {
	return v == nil
}
