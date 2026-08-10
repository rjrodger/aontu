/* Copyright (c) 2026 Richard Rodger, MIT License */

// Concurrent construction must be race-free. The tabnas engine's
// instance-id counter was a bare package-global increment — a data race
// under -race whenever two goroutines constructed parsers, which forced
// downstream projects to serialize ALL construction behind a global
// mutex. parser 0.8.0 made the counter atomic; this pins that aontu's
// own construction path (New -> mustMakeLang -> jsonic.Make + plugins)
// stays safe, so no such mutex is ever needed here.

package aontu

import (
	"sync"
	"testing"
)

func TestNewConcurrent(t *testing.T) {
	const n = 16
	var wg sync.WaitGroup
	errs := make([]error, n)
	wg.Add(n)
	for i := 0; i < n; i++ {
		go func(i int) {
			defer wg.Done()
			v, err := New().Unify("a:1 b:$.a")
			if err != nil {
				errs[i] = err
				return
			}
			if got := v.Canon(); got != `{"a":1,"b":1}` {
				t.Errorf("goroutine %d: got %s", i, got)
			}
		}(i)
	}
	wg.Wait()
	for i, err := range errs {
		if err != nil {
			t.Errorf("goroutine %d: %v", i, err)
		}
	}
}
