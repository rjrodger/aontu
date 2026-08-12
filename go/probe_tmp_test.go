package aontu

import (
	"os"
	"strings"
	"testing"
)

func TestProbeTmp(t *testing.T) {
	dir := os.Getenv("PROBE_DIR")
	if "" == dir {
		t.Skip("PROBE_DIR not set")
	}
	data, err := os.ReadFile(dir + "/probes9.tsv")
	if err != nil {
		t.Fatal(err)
	}
	esc := func(s string) string {
		s = strings.ReplaceAll(s, "\\", "\\\\")
		s = strings.ReplaceAll(s, "\t", "\\t")
		s = strings.ReplaceAll(s, "\n", "\\n")
		s = strings.ReplaceAll(s, "\x1b", "\\e")
		return s
	}
	var out []string
	for _, line := range strings.Split(string(data), "\n") {
		if "" == line || strings.HasPrefix(line, "#") {
			continue
		}
		parts := strings.Split(line, "\t")
		if len(parts) < 3 {
			continue
		}
		name, mode, src := parts[0], parts[1], parts[2]
		a := New()
		vars := specVars()
		res := ""
		switch mode {
		case "canon":
			v, uerr := a.UnifyVars(src, vars)
			if uerr != nil {
				res = "THREW:" + uerr.Error()
			} else {
				res = "OK:" + v.Canon()
			}
		case "gens":
			got, gerr := a.GenerateVars(src, vars)
			if gerr != nil {
				res = "THREW:" + gerr.Error()
			} else {
				text, merr := specGens(got)
				if merr != nil {
					res = "THREW:" + merr.Error()
				} else {
					res = "OK:" + text
				}
			}
		case "errmsg", "err":
			_, gerr := a.GenerateVars(src, vars)
			if gerr == nil {
				res = "NOERR"
			} else {
				res = "ERR:" + gerr.Error()
			}
		case "code", "errc":
			_, gerr := a.GenerateVars(src, vars)
			if gerr == nil {
				res = "NOERR"
			} else if ae, ok := gerr.(*AontuError); ok {
				res = "CODE:" + ae.Code
			} else {
				res = "CODE:<not-AontuError>"
			}
		}
		out = append(out, name+"\t"+mode+"\t"+esc(res))
	}
	werr := os.WriteFile(dir+"/go-out9.txt", []byte(strings.Join(out, "\n")+"\n"), 0644)
	if werr != nil {
		t.Fatal(werr)
	}
}
