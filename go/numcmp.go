/* Copyright (c) 2025 Richard Rodger, MIT License */

package aontu

// Exact cross-leaf numeric comparison for the constraint algebra
// (docs/reference-language.md, "The constraint algebra"): order is a
// property of the number line, not the leaf, so a bound must compare
// an integer, a float, a biginteger and a bigdecimal EXACTLY, with no
// rounding anywhere. Every finite binary64 is exactly a rational —
// mant * 2^exp — and 2^-k = 5^k * 10^-k, so every leaf converts
// losslessly to a signed scaled-decimal (unscaled / 10^scale) and
// comparison is big.Int arithmetic. The TS mirror is
// ts/src/val/numcmp.ts.
//
// The scaled forms built here are comparison-internal: never stored,
// never rendered, and deliberately NOT subject to the exact leaves'
// 4096-digit budget (a float's exact expansion can need ~770 digits
// and that is fine for a compare).

import (
	"math"
	"math/big"
)

// scaled is a comparison-internal exact rational with a power-of-ten
// denominator: value = unscaled / 10^scale. inf marks the binary64
// infinities.
type scaled struct {
	inf      int // -1, 0, 1
	unscaled *big.Int
	scale    int
}

var oneBig = big.NewInt(1)
var five = big.NewInt(5)
var ten = big.NewInt(10)

// scaledOfFloat is the exact scaled-decimal value of a binary64.
func scaledOfFloat(f float64) scaled {
	if f == math.Trunc(f) && math.Abs(f) <= 1<<53 && !math.IsInf(f, 0) {
		return scaled{unscaled: big.NewInt(int64(f)), scale: 0}
	}
	if math.IsInf(f, 1) {
		return scaled{inf: 1, unscaled: big.NewInt(0)}
	}
	if math.IsInf(f, -1) {
		return scaled{inf: -1, unscaled: big.NewInt(0)}
	}

	bits := math.Float64bits(f)
	neg := bits>>63 == 1
	expBits := int((bits >> 52) & 0x7ff)
	frac := new(big.Int).SetUint64(bits & 0xfffffffffffff)

	// Normal: implicit leading bit, exponent bias 1023 plus the 52
	// fraction bits. Subnormal: no implicit bit, fixed exponent -1074.
	var mant *big.Int
	var exp int
	if 0 == expBits {
		mant = frac
		exp = -1074
	} else {
		mant = frac.Or(frac, new(big.Int).Lsh(big.NewInt(1), 52))
		exp = expBits - 1075
	}

	var u *big.Int
	sc := 0
	if 0 <= exp {
		u = new(big.Int).Lsh(mant, uint(exp))
	} else {
		// mant * 2^-k == mant * 5^k / 10^k, exactly.
		u = new(big.Int).Mul(mant, new(big.Int).Exp(five, big.NewInt(int64(-exp)), nil))
		sc = -exp
	}
	if neg {
		u.Neg(u)
	}
	return scaled{unscaled: u, scale: sc}
}

// scaledOfNumeric is the exact scaled-decimal value of a numeric leaf.
func scaledOfNumeric(v *ScalarVal) scaled {
	switch v.kind {
	case KindBigInteger:
		return scaled{unscaled: new(big.Int).Set(v.peg.(*big.Int)), scale: 0}
	case KindBigDecimal:
		d := v.peg.(*Decimal)
		return scaled{unscaled: new(big.Int).Set(d.coeff), scale: int(d.scale)}
	case KindInteger:
		return scaled{unscaled: big.NewInt(v.peg.(int64)), scale: 0}
	}
	return scaledOfFloat(v.peg.(float64))
}

func pow10big(n int) *big.Int {
	return new(big.Int).Exp(ten, big.NewInt(int64(n)), nil)
}

// cmpScaled is the exact three-way comparison of two scaled decimals.
func cmpScaled(a, b scaled) int {
	if 0 != a.inf || 0 != b.inf {
		if a.inf < b.inf {
			return -1
		}
		if a.inf > b.inf {
			return 1
		}
		return 0
	}
	au := a.unscaled
	bu := b.unscaled
	if a.scale < b.scale {
		au = new(big.Int).Mul(au, pow10big(b.scale-a.scale))
	} else if b.scale < a.scale {
		bu = new(big.Int).Mul(bu, pow10big(a.scale-b.scale))
	}
	return au.Cmp(bu)
}

// cmpNumeric is the exact three-way comparison of two numeric leaf
// scalars, any leaves.
func cmpNumeric(a, b *ScalarVal) int {
	return cmpScaled(scaledOfNumeric(a), scaledOfNumeric(b))
}

// towerRank is the tower order integer < float < biginteger <
// bigdecimal, used when two endpoints at the SAME point meet: the
// survivor is the tower-lowest spelling.
func towerRank(v *ScalarVal) int {
	switch v.kind {
	case KindBigDecimal:
		return 3
	case KindBigInteger:
		return 2
	case KindInteger:
		return 0
	}
	return 1
}

// scaledIsIntegral reports whether a scaled value is an exact whole
// number.
func scaledIsIntegral(s scaled) bool {
	if 0 != s.inf {
		return false
	}
	if 0 == s.scale {
		return true
	}
	m := new(big.Int).Mod(s.unscaled, pow10big(s.scale))
	return 0 == m.Sign()
}

// scaledFloorBig is the exact floor of a finite scaled value.
func scaledFloorBig(s scaled) *big.Int {
	if 0 == s.scale {
		return new(big.Int).Set(s.unscaled)
	}
	q, m := new(big.Int).QuoRem(s.unscaled, pow10big(s.scale), new(big.Int))
	if s.unscaled.Sign() < 0 && 0 != m.Sign() {
		q.Sub(q, big.NewInt(1))
	}
	return q
}
