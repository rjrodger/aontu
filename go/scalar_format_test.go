package aontu

import "testing"

// TestFormatNumberJSParity pins formatNumber to JavaScript's
// Number.toString output (the TS implementation's canon formatting) at
// every magnitude, including the exponential-notation thresholds
// (fixed for exponents in [-6, 20], exponential outside) and the
// unpadded signed exponent style. Expected strings are the output of
// String(v) in Node for the same values.
func TestFormatNumberJSParity(t *testing.T) {
	cases := []struct {
		in   float64
		want string
	}{
		{0, "0"},
		{1, "1"},
		{1.5, "1.5"},
		{-2.5, "-2.5"},
		{1e-6, "0.000001"},
		{1e-7, "1e-7"},
		{1.5e-7, "1.5e-7"},
		{1e20, "100000000000000000000"},
		{1e21, "1e+21"},
		{1.5e21, "1.5e+21"},
		{1.2345678901234568e+29, "1.2345678901234568e+29"},
		{5e-324, "5e-324"},
		{1.7976931348623157e308, "1.7976931348623157e+308"},
		{1e308, "1e+308"},
		{0.1, "0.1"},
		{2.0 / 3.0, "0.6666666666666666"},
	}
	for _, c := range cases {
		if got := formatNumber(c.in); got != c.want {
			t.Errorf("formatNumber(%v) = %q, want %q", c.in, got, c.want)
		}
	}
}
