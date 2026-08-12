package referee

import (
	"context"
	"testing"

	"github.com/shashank-tomar0/ao-arena/internal/verdict"
)

func TestTheaterCheck_CatchesExpectTrue(t *testing.T) {
	c := NewTheaterCheck()
	pr := &PRContext{Diff: `
+  it("returns the value", () => {
+    expect(true).toBe(true);
+  });
`}
	fs, err := c.Run(context.Background(), pr)
	if err != nil {
		t.Fatal(err)
	}
	if len(fs) == 0 {
		t.Fatal("expected a theater finding, got none")
	}
	if fs[0].Severity != verdict.SeverityCritical {
		t.Fatalf("expected critical, got %s", fs[0].Severity)
	}
}

func TestTheaterCheck_CatchesEmptyTest(t *testing.T) {
	c := NewTheaterCheck()
	pr := &PRContext{Diff: `
+  test("does nothing", () => {});
`}
	fs, _ := c.Run(context.Background(), pr)
	if len(fs) == 0 {
		t.Fatal("expected theater finding for empty test, got none")
	}
}

func TestTheaterCheck_CatchesMutationPass(t *testing.T) {
	c := NewTheaterCheck()
	pr := &PRContext{
		TestOutput:        "1 passed, 0 failed",
		MutatedTestOutput: "1 passed, 0 failed",
	}
	fs, _ := c.Run(context.Background(), pr)
	if len(fs) == 0 {
		t.Fatal("expected mutation-differential finding, got none")
	}
	if fs[0].Category != theaterCheckName {
		t.Fatalf("expected category %s, got %s", theaterCheckName, fs[0].Category)
	}
}

func TestTheaterCheck_CleanDiffNoFindings(t *testing.T) {
	c := NewTheaterCheck()
	pr := &PRContext{Diff: `
+  assert.Equal(t, got, want)
+  expect(result).toEqual({ ok: true, count: 42 })
`}
	fs, _ := c.Run(context.Background(), pr)
	if len(fs) != 0 {
		t.Fatalf("expected no findings on clean assertions, got %d", len(fs))
	}
}
