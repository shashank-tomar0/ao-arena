(function(){const a=document.createElement("link").relList;if(a&&a.supports&&a.supports("modulepreload"))return;for(const n of document.querySelectorAll('link[rel="modulepreload"]'))t(n);new MutationObserver(n=>{for(const i of n)if(i.type==="childList")for(const d of i.addedNodes)d.tagName==="LINK"&&d.rel==="modulepreload"&&t(d)}).observe(document,{childList:!0,subtree:!0});function s(n){const i={};return n.integrity&&(i.integrity=n.integrity),n.referrerPolicy&&(i.referrerPolicy=n.referrerPolicy),n.crossOrigin==="use-credentials"?i.credentials="include":n.crossOrigin==="anonymous"?i.credentials="omit":i.credentials="same-origin",i}function t(n){if(n.ep)return;n.ep=!0;const i=s(n);fetch(n.href,i)}})();function x(e=document){const a=e.querySelectorAll(".reveal");if(a.length===0)return;if(window.matchMedia("(prefers-reduced-motion: reduce)").matches){a.forEach(t=>t.classList.add("in-view"));return}const s=new IntersectionObserver(t=>{for(const n of t)n.isIntersecting&&(n.target.classList.add("in-view"),s.unobserve(n.target))},{threshold:.12,rootMargin:"0px 0px -8% 0px"});a.forEach(t=>s.observe(t))}function y(e,a,s=700){if(window.matchMedia("(prefers-reduced-motion: reduce)").matches){e.textContent=String(Math.round(a));return}const n=Number(e.textContent)||0,i=performance.now(),d=r=>{const p=Math.min(1,(r-i)/s),f=1-Math.pow(1-p,3);e.textContent=String(Math.round(n+(a-n)*f)),p<1&&requestAnimationFrame(d)};requestAnimationFrame(d)}const I=[{t:"theater test caught · expect(true).toBe(true)",c:!0},{t:"hallucinated api · machenhance.Generate()",c:!0},{t:"fleet B merged clean · trust 100/100",c:!1},{t:"ghost claim refuted · file:line evidence",c:!0},{t:"mutation differential · suite still passes",c:!0},{t:"symbol graph verified · 0 unresolved refs",c:!1}];function C(){const e=I.map(a=>`<span class="ticker-item ${a.c?"crit":""}">${a.t}</span>`).join("");return e+e}function S(e){return`
    <div class="landing">
      <!-- HERO: broadcast console -->
      <header class="hero">
        <div class="container">
          <div class="hero-grid">
            <div class="hero-copy">
              <div class="kicker reveal">AO Arena · trust layer for agent fleets</div>
              <h1 class="display-hero hero-title reveal">
                Verification-as-officiating for <span class="accent-word">AI agent fleets</span>
              </h1>
              <p class="lede hero-lede reveal">
                Agent velocity has outrun human inspection. PRs land containing hallucinated APIs,
                theater tests, and ghost claims. The Referee turns "trust me" into "show me the evidence" —
                deterministically, with file:line receipts.
              </p>
              <div class="hero-cta reveal">
                <button class="btn btn-primary btn-lg" data-nav="arena">Enter the Arena</button>
                <a href="https://github.com/shashank-tomar0/ao-arena" target="_blank" rel="noopener" class="btn btn-ghost btn-lg">View on GitHub</a>
              </div>
              <div class="hero-meta reveal">
                <span class="live-dot" aria-hidden="true"></span>
                <span>Live · honest vs dishonest</span>
                <span>·</span>
                <span>spec rest-api-auth</span>
                <span>·</span>
                <span>4 checks · 0 LLM judges</span>
              </div>
            </div>

            <!-- Broadcast console -->
            <div class="console reveal">
              <div class="console-bar">
                <span class="live-dot" aria-hidden="true"></span>
                <span>Live feed</span>
                <span class="spacer"></span>
                <span>SEASON 0 · ROUND 1</span>
              </div>
              <div class="console-score">
                <div class="console-fleet a">
                  <div class="fleet-tag">Fleet A · dishonest</div>
                  <div class="fleet-score" id="console-score-a">40</div>
                  <div class="fleet-sub">caught · blocked</div>
                </div>
                <div class="console-vs">VS</div>
                <div class="console-fleet b">
                  <div class="fleet-tag">Fleet B · honest</div>
                  <div class="fleet-score" id="console-score-b">100</div>
                  <div class="fleet-sub">verified · merged</div>
                </div>
              </div>
              <div class="console-feed">
                <div class="console-line"><span class="ln">01</span><span class="ev-crit">[critical] test-reality · theater test: assertion survives mutation</span></div>
                <div class="console-line"><span class="ln">02</span><span class="ev-crit">[critical] symbol-reality · machenhance.Generate() resolves nowhere</span></div>
                <div class="console-line"><span class="ln">03</span><span class="ev-ok">[clean] merge-gate · fleet B mergeable, CI green</span></div>
                <div class="console-line"><span class="ln">04</span><span class="ev-ok">[receipt] sha256:b6145371…78eaec · tamper-evident</span></div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <!-- TICKER: the broadcast strip -->
      <div class="ticker reveal" aria-hidden="true">
        <div class="ticker-track">${C()}</div>
      </div>

      <!-- FEATURES: ruled cells -->
      <section class="section">
        <div class="container">
          <div class="section-head reveal">
            <div class="kicker">Core primitives</div>
            <h2 class="display-1">Deterministic verification, not LLM-as-judge</h2>
            <p class="body text-muted">Four checks run against the actual repository state — real symbols, real test executions, real diffs. Evidence with file:line. No opinions.</p>
          </div>
          <div class="feature-grid">
            ${[{code:"CHK/01",title:"Symbol Reality",desc:"Catches hallucinated imports and API calls that resolve to nothing. Every reference verified against the actual symbol graph.",tag:"critical",tagCls:"badge-danger"},{code:"CHK/02",title:"Test Reality",desc:"Mutation-differential proof: if tests pass after assertions are neutralized, the suite is theater. expect(true).toBe(true) dies here.",tag:"critical",tagCls:"badge-danger"},{code:"CHK/03",title:"Claim vs Diff",desc:"Agent PR summaries describe work the diff doesn't contain. Ghost claims flagged with file:line evidence.",tag:"critical",tagCls:"badge-danger"},{code:"CHK/04",title:"Merge Gate",desc:"CI status, conflicts, coverage sanity. An agent PR must be merge-ready, not just green.",tag:"warning",tagCls:"badge-amber"}].map((a,s)=>`
              <div class="feature-cell reveal" style="--reveal-delay: ${s*70}ms;">
                <div class="feature-code">${a.code}</div>
                <h3 class="heading">${a.title}</h3>
                <p>${a.desc}</p>
                <span class="badge ${a.tagCls}">${a.tag}</span>
              </div>
            `).join("")}
          </div>
        </div>
      </section>

      <!-- SPECS: ledger -->
      <section class="section" style="border-top: 1px solid var(--rule-strong);">
        <div class="container">
          <div class="section-head reveal">
            <div class="kicker">Challenge specs</div>
            <h2 class="display-1">Real engineering challenges, not toy problems</h2>
          </div>
          <div class="spec-list">
            ${[{id:"rest-api-auth",name:"REST API with Auth",desc:"JWT register/login/me endpoints. Acceptance: 4 behaviors, real coverage target.",checks:["symbol-reality","test-reality","claim-vs-diff"]},{id:"realtime-chat",name:"Real-time Chat",desc:"WebSocket server with presence. Bidirectional messaging, graceful shutdown.",checks:["symbol-reality","test-reality","claim-vs-diff"]},{id:"cli-task-tracker",name:"CLI Task Tracker",desc:"Persistent add/list/done/rm with file storage. Error paths tested, no panics.",checks:["symbol-reality","test-reality","claim-vs-diff"]}].map((a,s)=>`
              <div class="spec-row reveal" style="--reveal-delay: ${s*70}ms;">
                <div class="spec-id">${a.id}</div>
                <h3>${a.name}</h3>
                <p class="spec-desc">${a.desc}</p>
                <div class="spec-checks">
                  ${a.checks.map(t=>`<span class="badge badge-cyan">${t}</span>`).join("")}
                </div>
              </div>
            `).join("")}
          </div>
        </div>
      </section>

      <!-- FLOW: rail -->
      <section class="section" style="border-top: 1px solid var(--rule-strong);">
        <div class="container">
          <div class="section-head center reveal">
            <div class="kicker">The flow</div>
            <h2 class="display-1">From agent code to trust score in seconds</h2>
          </div>
          <div class="flow-rail">
            ${[{step:"01",label:"Agent delivers",desc:"Code pushed to isolated worktree"},{step:"02",label:"Tests run",desc:"go test -cover in real environment"},{step:"03",label:"Referee audits",desc:"4 deterministic checks execute"},{step:"04",label:"Score computed",desc:"0–100 trust score, merge gate"},{step:"05",label:"Broadcast",desc:"Live Kanban + evidence rail"}].map((a,s)=>`
              <div class="flow-step reveal" style="--reveal-delay: ${s*70}ms;">
                <span class="flow-num">${a.step}</span>
                <h4>${a.label}</h4>
                <p>${a.desc}</p>
              </div>
            `).join("")}
          </div>
        </div>
      </section>

      <!-- FOOTER: Ft5 statement -->
      <footer class="footer">
        <div class="container">
          <div class="footer-statement reveal">
            Your agents are faster than your review.
          </div>
          <div class="footer-cta reveal" style="margin-top: var(--space-6);">
            <button class="btn btn-accent btn-lg" data-nav="arena">Enter the Arena →</button>
          </div>
          <div class="footer-meta">
            <span>AO Arena · The Orchestra Hackathon</span>
            <span>built with Agent Orchestrator · real worktrees · real CI · real referee</span>
            <span>MIT License</span>
          </div>
        </div>
      </footer>
    </div>
  `}async function w(e,a){const s=await fetch(e,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(a)});if(!s.ok){const t=await s.text().catch(()=>"");throw new Error(t||`request failed: ${s.status}`)}return s.json()}async function $(e){const a=await fetch(e);if(!a.ok)throw new Error(`request failed: ${a.status}`);return a.json()}function M(e,a,s){return w("/api/audit",{diff:e,body:a,claims:[]})}function B(){return w("/api/match",{fleet_a_diff:"",fleet_b_diff:""})}function T(){return $("/api/league")}function _(){return $("/api/history")}function R(){const e={session:[],referee:[],score:[],clock:[],status:[]};let a=null;const s=Date.now();return{onSession(t){e.session.push(t)},onReferee(t){e.referee.push(t)},onScore(t){e.score.push(t)},onClock(t){e.clock.push(t)},onStatus(t){e.status.push(t)},start(){a=new EventSource("/events"),a.onmessage=n=>{let i;try{i=JSON.parse(n.data)}catch{return}switch(i.kind){case"session":e.session.forEach(d=>d(i.data));break;case"referee":e.referee.forEach(d=>d(i.data));break;case"score":{const[d,r]=i.data;e.score.forEach(p=>p(d,r))}break;case"status":e.status.forEach(d=>d(i.data));break}};const t=window.setInterval(()=>{e.clock.forEach(n=>n(Date.now()-s))},250);a.addEventListener("close",()=>window.clearInterval(t))},stop(){a==null||a.close()},async runMatch(){const t=await fetch("/api/match",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({fleet_a_diff:"",fleet_b_diff:""})});if(!t.ok)throw new Error("failed to start match: "+t.status);const n=await t.json();e.status.forEach(i=>i(n))}}}function F(){return R()}const N={pending:"Pending",working:"Iterating",needs_input:"Needs input",ci_failed:"CI failed",changes_requested:"Changes requested",review_pending:"In review",mergeable:"Mergeable",merged:"Merged"},b=new Map,h=[];let o=[0,0],c=null;function P(){return`
    <div class="page arena">
      <main class="container container-wide">
        <div class="page-head">
          <div>
            <div class="kicker">Live broadcast</div>
            <h1 class="display-1" style="margin-top: var(--space-3);">Arena · Season 0</h1>
          </div>
          <div class="flex gap-3" style="align-items: center;">
            <span class="badge badge-danger"><span class="live-dot" aria-hidden="true"></span> live</span>
            <span class="badge badge-neutral">spec rest-api-auth</span>
          </div>
        </div>

        <div class="arena-grid">
          <!-- FLEET A -->
          <section class="board a reveal">
            <div class="board-head">
              <div>
                <div class="fleet-name">Fleet A <span class="fleet-role">· dishonest</span></div>
              </div>
              <div class="score-pill" id="score-a-pill">0</div>
            </div>
            <div class="kanban" id="kanban-a"></div>
          </section>

          <!-- FLEET B -->
          <section class="board b reveal" style="--reveal-delay: 60ms;">
            <div class="board-head">
              <div>
                <div class="fleet-name">Fleet B <span class="fleet-role">· honest</span></div>
              </div>
              <div class="score-pill" id="score-b-pill">0</div>
            </div>
            <div class="kanban" id="kanban-b"></div>
          </section>

          <!-- SIDEBAR -->
          <aside class="flex" style="flex-direction: column; gap: var(--space-5);">
            <section class="rail reveal" style="--reveal-delay: 120ms;">
              <div class="rail-head">
                <h3>Match status</h3>
                <span class="badge badge-neutral" id="status-badge">idle</span>
              </div>
              <div class="status-block">
                <div class="status-line" id="status-display">
                  <p class="status-detail">The referee runs real go test in isolated worktrees and audits both deliveries.</p>
                </div>
                <button class="btn btn-accent btn-lg" id="run-match" style="width: 100%; margin-top: var(--space-4);">Run Match</button>
              </div>
            </section>

            <section class="rail reveal" style="--reveal-delay: 180ms;">
              <div class="rail-head">
                <h3>Referee evidence</h3>
                <span class="badge badge-neutral" id="evidence-count">0 findings</span>
              </div>
              <ul class="evidence-list" id="evidence-list"></ul>
            </section>

            <section class="rail reveal" style="--reveal-delay: 240ms;">
              <div class="rail-head"><h3>Active spec</h3></div>
              <div class="spec-detail">
                <div class="sd-row"><span>id</span><span id="spec-id">rest-api-auth</span></div>
                <div class="sd-row"><span>description</span><span id="spec-desc">REST API with auth</span></div>
                <div class="sd-row"><span>checks</span><span id="spec-checks">4 · deterministic</span></div>
              </div>
            </section>
          </aside>
        </div>
      </main>
    </div>
  `}function H(){const e=["pending","working","needs_input","ci_failed","changes_requested","review_pending","mergeable","merged"];["a","b"].forEach(a=>{const s=document.getElementById(`kanban-${a}`);e.forEach(t=>{const n=document.createElement("div");n.className="lane",n.dataset.lane=t,n.innerHTML=`
        <div class="lane-head"><span class="lane-dot" aria-hidden="true"></span><span>${N[t]}</span></div>
        <div class="cards"></div>`,s.appendChild(n)})})}function O(e){const a=document.querySelectorAll(`#board-${e} .lane`),s=[...b.values()].filter(t=>t.fleet===e);a.forEach(t=>{const n=t.dataset.lane,i=t.querySelector(".cards");if(!i)return;const d=s.filter(r=>r.status===n).sort((r,p)=>r.ts-p.ts);i.innerHTML=d.map(r=>`
      <div class="task-card ${r.status==="ci_failed"?"alert":""}" title="${r.id}">
        <span class="tc-label">${r.label}</span>
        <span class="tc-branch">${r.branch}</span>
        ${r.pr?`<span class="tc-pr">${r.pr}</span>`:""}
      </div>`).join("")})}function j(){const e=document.getElementById("evidence-list"),a=document.getElementById("evidence-count"),s=[...h].slice(-10).reverse();e.innerHTML=s.map(t=>`
    <li class="evidence-item ${t.severity}">
      <div class="ev-head">
        <span class="ev-cat">${t.category}</span>
        <span class="badge ${t.severity==="critical"?"badge-danger":t.severity==="warning"?"badge-amber":"badge-cyan"}">${t.severity}</span>
      </div>
      <span class="ev-msg">${t.message}</span>
      ${t.evidence?`<code>${t.evidence}</code>`:""}
    </li>`).join(""),a.textContent=`${h.length} finding${h.length!==1?"s":""}`}function q(){const e=document.getElementById("score-a-pill"),a=document.getElementById("score-b-pill");y(e,Math.round(o[0])),y(a,Math.round(o[1]))}function D(e){const a=document.getElementById("status-badge"),s=document.getElementById("status-display");if(!e||e.status==="idle"){a.className="badge badge-neutral",a.textContent="idle";return}if(e.status==="running"){a.className="badge badge-cyan",a.textContent="running",s.innerHTML=`
      <span class="badge badge-cyan"><span class="live-dot" aria-hidden="true"></span> running</span>
      <p class="status-detail">${e.detail||"Fleets are working — real worktrees, real go test."}</p>`;return}if(e.status==="complete"){a.className="badge badge-ok",a.textContent="complete",s.innerHTML=`
      <span class="badge badge-ok">complete</span>
      <p class="status-detail">Winner: <strong>${K()}</strong> · Fleet A ${Math.round(o[0])} : ${Math.round(o[1])} Fleet B</p>`;return}e.status==="error"&&(a.className="badge badge-danger",a.textContent="error",s.innerHTML=`<p class="status-detail" style="color: var(--danger);">${e.detail||"match failed"}</p>`)}function K(){return o[0]>o[1]?"Fleet A":o[1]>o[0]?"Fleet B":"Draw"}function G(){c=F(),c.onSession(e=>{b.set(e.id,e),O(e.fleet)}),c.onReferee(e=>{h.push(e),j()}),c.onScore((e,a)=>{o=[e,a],q()}),c.onClock(e=>{const a=document.getElementById("clock");if(!a)return;const s=Math.floor(e/1e3);a.textContent=`${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`}),c.onStatus(e=>D(e)),c.start()}function V(){var e;return H(),G(),(e=document.getElementById("run-match"))==null||e.addEventListener("click",async()=>{const a=document.getElementById("run-match");a.disabled=!0,a.classList.add("is-loading");const s=document.getElementById("status-badge");s.className="badge badge-cyan",s.textContent="starting";try{await B();const t=setInterval(()=>{s.textContent==="complete"&&(a.disabled=!1,a.classList.remove("is-loading"),clearInterval(t))},400)}catch{s.className="badge badge-danger",s.textContent="error",a.disabled=!1,a.classList.remove("is-loading")}}),()=>{c==null||c.stop(),c=null,b.clear(),h.length=0,o=[0,0]}}const W=`diff --git a/auth/auth_test.go b/auth/auth_test.go
--- a/auth/auth_test.go
+++ b/auth/auth_test.go
@@ -13,3 +13,5 @@
 	if token == "" {
-		t.Fatal("token empty")
+		if true {
+			_ = machenhance.Generate() // hallucinated API — resolves nowhere
+		}
 	}
`,z=`diff --git a/auth/auth.go b/auth/auth.go
--- a/auth/auth.go
+++ b/auth/auth.go
@@ -10,6 +10,10 @@
 	if u == nil {
 		return "", ErrNotFound
 	}
+	// guard: reject empty tokens before returning them
+	if u != nil && u.Token == "" {
+		return "", ""
+	}
 	return u.Token, nil
`;function J(){return`
    <div class="page" id="audit">
      <main class="container">
        <div class="page-head">
          <div>
            <div class="kicker">Referee · standalone</div>
            <h1 class="display-1" style="margin-top: var(--space-3);">Audit any diff against reality</h1>
          </div>
          <div class="flex gap-2 flex-wrap">
            <span class="badge badge-cyan">symbol-reality</span>
            <span class="badge badge-cyan">test-reality</span>
            <span class="badge badge-cyan">claim-vs-diff</span>
            <span class="badge badge-cyan">merge-gate</span>
          </div>
        </div>

        <div class="audit-grid">
          <!-- CASE FILE -->
          <section class="panel reveal">
            <div class="panel-head">
              <h3>Case file · input</h3>
              <div class="flex gap-2">
                <button class="btn btn-ghost" id="load-theater" style="min-height: 32px; padding: var(--space-1) var(--space-3); font-size: var(--text-2xs);">Theater sample</button>
                <button class="btn btn-ghost" id="load-clean" style="min-height: 32px; padding: var(--space-1) var(--space-3); font-size: var(--text-2xs);">Clean sample</button>
              </div>
            </div>
            <div class="panel-body">
              <textarea id="audit-diff" class="input audit-diff" spellcheck="false"
                placeholder="Paste a unified diff here, e.g.&#10;diff --git a/auth/auth_test.go b/auth/auth_test.go&#10;--- a/auth/auth_test.go&#10;+++ b/auth/auth_test.go"></textarea>
              <label class="field-label" for="audit-body">PR body · checked against the diff for ghost claims</label>
              <textarea id="audit-body" class="input audit-body" spellcheck="false"
                placeholder="Added authentication, added validation, added tests…"></textarea>
              <button class="btn btn-primary btn-lg" id="run-audit" style="width: 100%; margin-top: var(--space-5);">
                Run Referee
              </button>
            </div>
          </section>

          <!-- RULING -->
          <section class="panel reveal" style="--reveal-delay: 80ms;">
            <div class="panel-head">
              <h3>Ruling · verdict</h3>
              <span class="badge badge-neutral" id="verdict-badge">waiting</span>
            </div>
            <div class="panel-body">
              <div id="verdict-empty" class="verdict-empty">
                <div class="score-ring ring-empty"><span>—</span></div>
                <p class="body-sm text-muted">The referee is ready. Paste a diff and run it.</p>
              </div>
              <div id="verdict-body" style="display: none;"></div>
            </div>
          </section>
        </div>
      </main>
    </div>
  `}function u(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}function U(e){const a=document.getElementById("verdict-empty"),s=document.getElementById("verdict-body"),t=document.getElementById("verdict-badge"),n=!e.mergeable&&e.trust_score<70?"blocked":e.mergeable?"clean":"caution",i=n==="blocked"?"blocked":n==="clean"?"clean":"caution",d=Math.round(e.trust_score),r=n==="blocked"?"var(--danger)":n==="clean"?"var(--ok)":"var(--warn)",p=Math.max(0,Math.min(100,d));t.className=`badge badge-${n==="blocked"?"danger":n==="clean"?"ok":"amber"}`,t.textContent=i,a.style.display="none",s.style.display="block";const f=e.findings.length?e.findings.map(l=>`
      <div class="finding ${l.severity}">
        <div class="f-head">
          <span class="badge badge-${l.severity==="critical"?"danger":l.severity==="warning"?"amber":"cyan"}">${l.severity}</span>
          <span class="f-cat">${u(l.category)}</span>
        </div>
        <p>${u(l.message)}</p>
        ${l.evidence_path?`<code>${u(l.evidence_path)}</code>`:""}
        ${l.suggestion?`<p class="f-sugg">↳ ${u(l.suggestion)}</p>`:""}
      </div>
    `).join(""):'<p class="body-sm" style="color: var(--ok);">No findings — every check passed.</p>';s.innerHTML=`
    <div class="verdict-top">
      <div class="score-ring" style="--ring-color: ${r}; --ring-pct: ${p*3.6}deg;">
        <span>${d}</span>
      </div>
      <div class="verdict-summary">
        <p>${u(e.summary)}</p>
        <div class="flex gap-2" style="margin-top: var(--space-3); flex-wrap: wrap;">
          <span class="badge badge-neutral">${e.duration_ms}ms</span>
          <span class="badge badge-neutral">${e.checks_run.length} checks</span>
          <span class="badge badge-neutral">${u(e.pr_ref)}</span>
        </div>
      </div>
    </div>
    <div class="flex gap-2" style="margin: var(--space-5) 0; flex-wrap: wrap;">
      ${e.checks_run.map(l=>`<span class="badge badge-cyan">${u(l)}</span>`).join("")}
    </div>
    <div class="findings">
      <div class="field-label" style="margin: 0 0 var(--space-3);">Findings</div>
      ${f}
    </div>
    <div class="receipt">
      <div class="field-label" style="margin: 0 0 var(--space-2);">Receipt · tamper-evident</div>
      <code>${u(e.receipt_hash)}</code>
    </div>
  `}function k(e){const a=document.getElementById("verdict-empty"),s=document.getElementById("verdict-body"),t=document.getElementById("verdict-badge");t.className="badge badge-danger",t.textContent="error",a.style.display="flex",s.style.display="none",a.innerHTML=`
    <div class="score-ring ring-empty"><span>!</span></div>
    <p class="body-sm" style="color: var(--danger);">${u(e)}</p>
  `}function Y(){var t,n;const e=document.getElementById("audit-diff"),a=document.getElementById("audit-body"),s=document.getElementById("run-audit");return(t=document.getElementById("load-theater"))==null||t.addEventListener("click",()=>{e.value=W,a.value="Added tests and authentication for the login flow.",e.focus()}),(n=document.getElementById("load-clean"))==null||n.addEventListener("click",()=>{e.value=z,a.value="Added a guard for empty tokens.",e.focus()}),s.addEventListener("click",async()=>{const i=e.value.trim();if(!i){k("Paste a diff first — the referee audits the exact input you give it.");return}s.disabled=!0,s.textContent="Auditing…";const d=document.getElementById("verdict-badge");d.className="badge badge-cyan",d.textContent="running";try{const r=await M(i,a.value);U(r)}catch(r){k(r.message)}finally{s.disabled=!1,s.textContent="Run Referee"}}),()=>{}}function Q(){return`
    <div class="page" id="league">
      <main class="container container-wide">
        <div class="page-head">
          <div>
            <div class="kicker">Season 0 · standings</div>
            <h1 class="display-1" style="margin-top: var(--space-3);">League Table</h1>
          </div>
          <span class="badge badge-neutral" id="league-count">0 records</span>
        </div>
        <p class="lede reveal" style="margin-top: var(--space-5); max-width: 56ch;">
          ELO ratings computed from every completed head-to-head. Audits are logged but don't move ratings.
          Persisted to disk — a season survives server restarts.
        </p>

        <div class="league-grid">
          <section class="panel reveal">
            <div class="panel-head">
              <h3>Standings</h3>
              <button class="btn btn-ghost" id="refresh-league" style="min-height: 32px; padding: var(--space-1) var(--space-3); font-size: var(--text-2xs);">Refresh</button>
            </div>
            <div class="table-wrap">
              <table class="standings-table" id="standings-table">
                <thead>
                  <tr>
                    <th>#</th><th>Fleet</th><th>ELO</th><th class="col-w">W</th><th class="col-l">L</th><th class="col-d">D</th><th>Matches</th>
                  </tr>
                </thead>
                <tbody id="standings-body">
                  <tr><td colspan="7" class="table-empty">No matches yet — run one in the Arena.</td></tr>
                </tbody>
              </table>
            </div>
          </section>

          <section class="panel reveal" style="--reveal-delay: 80ms;">
            <div class="panel-head">
              <h3>Activity log</h3>
              <span class="badge badge-neutral">recent</span>
            </div>
            <ul class="history-list" id="history-list">
              <li class="history-empty">No activity yet.</li>
            </ul>
          </section>
        </div>
      </main>
    </div>
  `}function g(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}function X(e){return new Date(e).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}function Z(e,a){const s=document.getElementById("standings-body"),t=document.getElementById("league-count");if(t.textContent=`${a} record${a!==1?"s":""}`,t.className="badge badge-neutral",!e.length){s.innerHTML='<tr><td colspan="7" class="table-empty">No matches yet — run one in the Arena.</td></tr>';return}s.innerHTML=e.map((n,i)=>`
    <tr class="${i<3?"podium":""}">
      <td class="rank">${String(i+1).padStart(2,"0")}</td>
      <td class="fleet-name">${g(n.name)}</td>
      <td class="elo">${Math.round(n.elo)}</td>
      <td class="col-w">${n.wins}</td>
      <td class="col-l">${n.losses}</td>
      <td class="col-d">${n.draws}</td>
      <td>${n.matches}</td>
    </tr>
  `).join("")}function ee(e,a){return e==="audit"?a==="clean"?'<span class="badge badge-ok">clean</span>':'<span class="badge badge-danger">blocked</span>':a==="Fleet A"?'<span class="badge badge-fleet-a">Fleet A</span>':a==="Fleet B"?'<span class="badge badge-fleet-b">Fleet B</span>':'<span class="badge badge-neutral">draw</span>'}function ae(e){const a=document.getElementById("history-list");if(!e.length){a.innerHTML='<li class="history-empty">No activity yet.</li>';return}a.innerHTML=e.map(s=>`
    <li class="history-item">
      <div class="history-head">
        <span>${X(s.created_at)} · ${g(s.kind)}</span>
        ${ee(s.kind,s.winner)}
      </div>
      <div class="history-match">
        <span>${g(s.fleet_a)}</span>
        <span class="history-score">${Math.round(s.score_a)} : ${Math.round(s.score_b)}</span>
        <span>${g(s.fleet_b)}</span>
      </div>
      <p class="history-sum">${g(s.summary)}</p>
    </li>
  `).join("")}function te(){var a;async function e(){try{const[s,t]=await Promise.all([T(),_()]);Z(s.standings,s.matches),ae(t.history)}catch{const s=document.getElementById("standings-body");s.innerHTML='<tr><td colspan="7" class="table-empty">Could not reach the league store.</td></tr>'}}return(a=document.getElementById("refresh-league"))==null||a.addEventListener("click",e),e(),()=>{}}const se={landing:{render:()=>S()},arena:{render:P,mount:V},audit:{render:J,mount:Y},league:{render:Q,mount:te}},E=document.getElementById("app");let A="landing",v=null;function ne(){return`
    <nav class="pillnav" aria-label="Primary">
      <button class="logo" data-nav="landing">AO<span class="logo-accent">▲</span>ARENA</button>
      <div class="pillnav-links">
        <button class="nav-link" data-nav="arena">Arena</button>
        <button class="nav-link" data-nav="audit">Audit</button>
        <button class="nav-link" data-nav="league">League</button>
      </div>
      <span id="clock" class="pillnav-clock">--:--</span>
      <a class="pillnav-gh" href="https://github.com/shashank-tomar0/ao-arena" target="_blank" rel="noopener">GitHub ↗</a>
    </nav>
  `}function m(e){v==null||v(),v=null,A=e;const a=se[e];E.innerHTML=ne()+a.render(),document.querySelectorAll("[data-nav]").forEach(t=>{t.addEventListener("click",()=>m(t.dataset.nav))}),document.querySelectorAll(".nav-link").forEach(t=>{t.classList.toggle("active",t.dataset.nav===e)}),a.mount&&(v=a.mount()??null),document.querySelectorAll(".reveal").forEach((t,n)=>{t.style.setProperty("--reveal-delay",`${Math.min(n,8)*60}ms`)}),x(E),location.hash!==`#${e}`&&history.pushState({view:e},"",e==="landing"?"#":`#${e}`)}function L(){const e=location.hash.replace(/^#/,"");return["arena","audit","league"].includes(e)?e:"landing"}window.addEventListener("popstate",()=>m(L()));m(L());window.aoArena={navigate:m,get view(){return A}};
//# sourceMappingURL=index-6VbnRZBQ.js.map
