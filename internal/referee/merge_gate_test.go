package referee

import (
	"context"
	"testing"

	"github.com/shashank-tomar0/ao-arena/internal/verdict"
)

func TestMergeGate_CatchesFailedCI(t *testing.T) {
	c := NewMergeGateCheck()
	pr := &PRContext{
		ChecksStatus: map[string]string{"build": "failure"},
	}
	fs, _ := c.Run(context.Background(), pr)
	if len(fs) == 0 {
		t.Fatal("expected failed-CI finding, got none")
	}
	if fs[0].Severity != verdict.SeverityCritical {
		t.Fatalf("expected critical, got %s", fs[0].Severity)
	}
}

func TestMergeGate_PendingCIWarns(t *testing.T) {
	c := NewMergeGateCheck()
	pr := &PRContext{
		ChecksStatus: map[string]string{"test": "pending"},
	}
	fs, _ := c.Run(context.Background(), pr)
	if len(fs) == 0 {
		t.Fatal("expected pending-CI warning, got none")
	}
	if fs[0].Severity != verdict.SeverityWarning {
		t.Fatalf("expected warning, got %s", fs[0].Severity)
	}
}

func TestMergeGate_NotMergeableCritical(t *testing.T) {
	c := NewMergeGateCheck()
	notMergeable := false
	pr := &PRContext{Mergeable: &notMergeable}
	fs, _ := c.Run(context.Background(), pr)
	found := false
	for _, f := range fs {
		if f.Category == mergeGateName && f.Severity == verdict.SeverityCritical {
			found = true
		}
	}
	if !found {
		t.Fatal("expected critical not-mergeable finding")
	}
}

func TestMergeGate_CleanCIAndMergeableNoFindings(t *testing.T) {
	c := NewMergeGateCheck()
	mergeable := true
	pr := &PRContext{
		Mergeable:    &mergeable,
		ChecksStatus: map[string]string{"build": "success", "test": "success"},
	}
	fs, _ := c.Run(context.Background(), pr)
	if len(fs) != 0 {
		t.Fatalf("expected no findings on clean CI, got %d", len(fs))
	}
}
