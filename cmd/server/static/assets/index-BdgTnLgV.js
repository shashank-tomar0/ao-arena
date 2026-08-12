(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const n of document.querySelectorAll('link[rel="modulepreload"]'))s(n);new MutationObserver(n=>{for(const i of n)if(i.type==="childList")for(const d of i.addedNodes)d.tagName==="LINK"&&d.rel==="modulepreload"&&s(d)}).observe(document,{childList:!0,subtree:!0});function a(n){const i={};return n.integrity&&(i.integrity=n.integrity),n.referrerPolicy&&(i.referrerPolicy=n.referrerPolicy),n.crossOrigin==="use-credentials"?i.credentials="include":n.crossOrigin==="anonymous"?i.credentials="omit":i.credentials="same-origin",i}function s(n){if(n.ep)return;n.ep=!0;const i=a(n);fetch(n.href,i)}})();function _(e=document){const t=e.querySelectorAll(".reveal");if(t.length===0)return;if(window.matchMedia("(prefers-reduced-motion: reduce)").matches){t.forEach(s=>s.classList.add("in-view"));return}const a=new IntersectionObserver(s=>{for(const n of s)n.isIntersecting&&(n.target.classList.add("in-view"),a.unobserve(n.target))},{threshold:.12,rootMargin:"0px 0px -8% 0px"});t.forEach(s=>a.observe(s))}function h(e,t,a=700){if(window.matchMedia("(prefers-reduced-motion: reduce)").matches){e.textContent=String(Math.round(t));return}const n=Number(e.textContent)||0,i=performance.now(),d=o=>{const c=Math.min(1,(o-i)/a),g=1-Math.pow(1-c,3);e.textContent=String(Math.round(n+(t-n)*g)),c<1&&requestAnimationFrame(d)};requestAnimationFrame(d)}const R=[{t:"theater test caught · expect(true).toBe(true)",c:!0},{t:"hallucinated api · machenhance.Generate()",c:!0},{t:"fleet B merged clean · trust 100/100",c:!1},{t:"ghost claim refuted · file:line evidence",c:!0},{t:"mutation differential · suite still passes",c:!0},{t:"symbol graph verified · 0 unresolved refs",c:!1}];function N(){const e=R.map(t=>`<span class="ticker-item ${t.c?"crit":""}">${t.t}</span>`).join("");return e+e}function F(e){return`
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
        <div class="ticker-track">${N()}</div>
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
            ${[{code:"CHK/01",title:"Symbol Reality",desc:"Catches hallucinated imports and API calls that resolve to nothing. Every reference verified against the actual symbol graph.",tag:"critical",tagCls:"badge-danger"},{code:"CHK/02",title:"Test Reality",desc:"Mutation-differential proof: if tests pass after assertions are neutralized, the suite is theater. expect(true).toBe(true) dies here.",tag:"critical",tagCls:"badge-danger"},{code:"CHK/03",title:"Claim vs Diff",desc:"Agent PR summaries describe work the diff doesn't contain. Ghost claims flagged with file:line evidence.",tag:"critical",tagCls:"badge-danger"},{code:"CHK/04",title:"Merge Gate",desc:"CI status, conflicts, coverage sanity. An agent PR must be merge-ready, not just green.",tag:"warning",tagCls:"badge-amber"}].map((t,a)=>`
              <div class="feature-cell reveal" style="--reveal-delay: ${a*70}ms;">
                <div class="feature-code">${t.code}</div>
                <h3 class="heading">${t.title}</h3>
                <p>${t.desc}</p>
                <span class="badge ${t.tagCls}">${t.tag}</span>
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
            ${[{id:"rest-api-auth",name:"REST API with Auth",desc:"JWT register/login/me endpoints. Acceptance: 4 behaviors, real coverage target.",checks:["symbol-reality","test-reality","claim-vs-diff"]},{id:"realtime-chat",name:"Real-time Chat",desc:"WebSocket server with presence. Bidirectional messaging, graceful shutdown.",checks:["symbol-reality","test-reality","claim-vs-diff"]},{id:"cli-task-tracker",name:"CLI Task Tracker",desc:"Persistent add/list/done/rm with file storage. Error paths tested, no panics.",checks:["symbol-reality","test-reality","claim-vs-diff"]}].map((t,a)=>`
              <div class="spec-row reveal" style="--reveal-delay: ${a*70}ms;">
                <div class="spec-id">${t.id}</div>
                <h3>${t.name}</h3>
                <p class="spec-desc">${t.desc}</p>
                <div class="spec-checks">
                  ${t.checks.map(s=>`<span class="badge badge-cyan">${s}</span>`).join("")}
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
            ${[{step:"01",label:"Agent delivers",desc:"Code pushed to isolated worktree"},{step:"02",label:"Tests run",desc:"go test -cover in real environment"},{step:"03",label:"Referee audits",desc:"4 deterministic checks execute"},{step:"04",label:"Score computed",desc:"0–100 trust score, merge gate"},{step:"05",label:"Broadcast",desc:"Live Kanban + evidence rail"}].map((t,a)=>`
              <div class="flow-step reveal" style="--reveal-delay: ${a*70}ms;">
                <span class="flow-num">${t.step}</span>
                <h4>${t.label}</h4>
                <p>${t.desc}</p>
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
  `}async function A(e,t){const a=await fetch(e,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(t)});if(!a.ok){const s=await a.text().catch(()=>"");throw new Error(s||`request failed: ${a.status}`)}return a.json()}async function x(e){const t=await fetch(e);if(!t.ok)throw new Error(`request failed: ${t.status}`);return t.json()}function O(e,t,a){return A("/api/audit",{diff:e,body:t,claims:[]})}function H(){return A("/api/match",{fleet_a_diff:"",fleet_b_diff:""})}function P(){return x("/api/league")}function j(){return x("/api/history")}function q(){const e={session:[],referee:[],score:[],clock:[],status:[]};let t=null;const a=Date.now();return{onSession(s){e.session.push(s)},onReferee(s){e.referee.push(s)},onScore(s){e.score.push(s)},onClock(s){e.clock.push(s)},onStatus(s){e.status.push(s)},start(){t=new EventSource("/events"),t.onmessage=n=>{let i;try{i=JSON.parse(n.data)}catch{return}switch(i.kind){case"session":e.session.forEach(d=>d(i.data));break;case"referee":e.referee.forEach(d=>d(i.data));break;case"score":{const[d,o]=i.data;e.score.forEach(c=>c(d,o))}break;case"status":e.status.forEach(d=>d(i.data));break}};const s=window.setInterval(()=>{e.clock.forEach(n=>n(Date.now()-a))},250);t.addEventListener("close",()=>window.clearInterval(s))},stop(){t==null||t.close()},async runMatch(){const s=await fetch("/api/match",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({fleet_a_diff:"",fleet_b_diff:""})});if(!s.ok)throw new Error("failed to start match: "+s.status);const n=await s.json();e.status.forEach(i=>i(n))}}}function B(){return q()}const C={pending:"Pending",working:"Iterating",needs_input:"Needs input",ci_failed:"CI failed",changes_requested:"Changes requested",review_pending:"In review",mergeable:"Mergeable",merged:"Merged"},w=new Map,b=[],y=new Map;let u=[0,0],r=null;function D(){return`
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
  `}function K(){const e=["pending","working","needs_input","ci_failed","changes_requested","review_pending","mergeable","merged"];["a","b"].forEach(t=>{const a=document.getElementById(`kanban-${t}`);e.forEach(s=>{const n=document.createElement("div");n.className="lane",n.dataset.lane=s,n.innerHTML=`
        <div class="lane-head"><span class="lane-dot" aria-hidden="true"></span><span>${C[s]}</span></div>
        <div class="cards"></div>`,a.appendChild(n)})})}function V(e){const t=document.querySelectorAll(`#board-${e} .lane`),a=[...w.values()].filter(s=>s.fleet===e);t.forEach(s=>{const n=s.dataset.lane,i=s.querySelector(".cards");if(!i)return;const d=a.filter(c=>c.status===n).sort((c,g)=>c.ts-g.ts);d.some(c=>y.get(c.id)!==n)&&(s.classList.remove("flash"),s.offsetWidth,s.classList.add("flash")),i.innerHTML=d.map(c=>{const g=y.get(c.id)!==c.status;return`
        <div class="task-card ${c.status==="ci_failed"?"alert":""} ${g?"is-new":""}" title="${c.id}">
          <span class="tc-label">${c.label}</span>
          <span class="tc-branch">${c.branch}</span>
          ${c.pr?`<span class="tc-pr">${c.pr}</span>`:""}
        </div>`}).join(""),d.forEach(c=>y.set(c.id,n))})}function W(){const e=document.getElementById("evidence-list"),t=document.getElementById("evidence-count"),a=[...b].slice(-10).reverse();e.innerHTML=a.map(s=>`
    <li class="evidence-item ${s.severity}">
      <div class="ev-head">
        <span class="ev-cat">${s.category}</span>
        <span class="badge ${s.severity==="critical"?"badge-danger":s.severity==="warning"?"badge-amber":"badge-cyan"}">${s.severity}</span>
      </div>
      <span class="ev-msg">${s.message}</span>
      ${s.evidence?`<code>${s.evidence}</code>`:""}
    </li>`).join(""),t.textContent=`${b.length} finding${b.length!==1?"s":""}`}function G(){const e=document.getElementById("score-a-pill"),t=document.getElementById("score-b-pill");h(e,Math.round(u[0])),h(t,Math.round(u[1])),[e,t].forEach(a=>{a.classList.remove("score-pulse"),a.offsetWidth,a.classList.add("score-pulse")})}function U(e){const t=document.getElementById("status-badge"),a=document.getElementById("status-display");if(!e||e.status==="idle"){t.className="badge badge-neutral",t.textContent="idle";return}if(e.status==="running"){t.className="badge badge-cyan",t.textContent="running",a.innerHTML=`
      <span class="badge badge-cyan"><span class="live-dot" aria-hidden="true"></span> running</span>
      <p class="status-detail">${e.detail||"Fleets are working — real worktrees, real go test."}</p>`;return}if(e.status==="complete"){t.className="badge badge-ok",t.textContent="complete",a.innerHTML=`
      <span class="badge badge-ok">complete</span>
      <p class="status-detail">Winner: <strong>${z()}</strong> · Fleet A ${Math.round(u[0])} : ${Math.round(u[1])} Fleet B</p>`;return}e.status==="error"&&(t.className="badge badge-danger",t.textContent="error",a.innerHTML=`<p class="status-detail" style="color: var(--danger);">${e.detail||"match failed"}</p>`)}function z(){return u[0]>u[1]?"Fleet A":u[1]>u[0]?"Fleet B":"Draw"}function J(){r=B(),r.onSession(e=>{w.set(e.id,e),V(e.fleet)}),r.onReferee(e=>{b.push(e),W()}),r.onScore((e,t)=>{u=[e,t],G()}),r.onClock(e=>{const t=document.getElementById("clock");if(!t)return;const a=Math.floor(e/1e3);t.textContent=`${String(Math.floor(a/60)).padStart(2,"0")}:${String(a%60).padStart(2,"0")}`}),r.onStatus(e=>U(e)),r.start()}function Y(){var e;return K(),J(),(e=document.getElementById("run-match"))==null||e.addEventListener("click",async()=>{const t=document.getElementById("run-match");t.disabled=!0,t.classList.add("is-loading");const a=document.getElementById("status-badge");a.className="badge badge-cyan",a.textContent="starting";try{await H();const s=setInterval(()=>{a.textContent==="complete"&&(t.disabled=!1,t.classList.remove("is-loading"),clearInterval(s))},400)}catch{a.className="badge badge-danger",a.textContent="error",t.disabled=!1,t.classList.remove("is-loading")}}),()=>{r==null||r.stop(),r=null,w.clear(),b.length=0,y.clear(),u=[0,0]}}const Q=`diff --git a/auth/auth_test.go b/auth/auth_test.go
--- a/auth/auth_test.go
+++ b/auth/auth_test.go
@@ -13,3 +13,5 @@
 	if token == "" {
-		t.Fatal("token empty")
+		if true {
+			_ = machenhance.Generate() // hallucinated API — resolves nowhere
+		}
 	}
`,X=`diff --git a/auth/auth.go b/auth/auth.go
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
`;function Z(){return`
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
  `}function p(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}function ee(e){const t=document.getElementById("verdict-empty"),a=document.getElementById("verdict-body"),s=document.getElementById("verdict-badge"),n=!e.mergeable&&e.trust_score<70?"blocked":e.mergeable?"clean":"caution",i=n==="blocked"?"blocked":n==="clean"?"clean":"caution",d=Math.round(e.trust_score),o=n==="blocked"?"var(--danger)":n==="clean"?"var(--ok)":"var(--warn)",c=Math.max(0,Math.min(100,d));s.className=`badge badge-${n==="blocked"?"danger":n==="clean"?"ok":"amber"}`,s.textContent=i,t.style.display="none",a.style.display="block";const g=e.findings.length?e.findings.map(l=>`
      <div class="finding ${l.severity}">
        <div class="f-head">
          <span class="badge badge-${l.severity==="critical"?"danger":l.severity==="warning"?"amber":"cyan"}">${l.severity}</span>
          <span class="f-cat">${p(l.category)}</span>
        </div>
        <p>${p(l.message)}</p>
        ${l.evidence_path?`<code>${p(l.evidence_path)}</code>`:""}
        ${l.suggestion?`<p class="f-sugg">↳ ${p(l.suggestion)}</p>`:""}
      </div>
    `).join(""):'<p class="body-sm" style="color: var(--ok);">No findings — every check passed.</p>';a.innerHTML=`
    <div class="verdict-top">
      <div class="score-ring" style="--ring-color: ${o}; --ring-pct: ${c*3.6}deg;">
        <span>${d}</span>
      </div>
      <div class="verdict-summary">
        <p>${p(e.summary)}</p>
        <div class="flex gap-2" style="margin-top: var(--space-3); flex-wrap: wrap;">
          <span class="badge badge-neutral">${e.duration_ms}ms</span>
          <span class="badge badge-neutral">${e.checks_run.length} checks</span>
          <span class="badge badge-neutral">${p(e.pr_ref)}</span>
        </div>
      </div>
    </div>
    <div class="flex gap-2" style="margin: var(--space-5) 0; flex-wrap: wrap;">
      ${e.checks_run.map(l=>`<span class="badge badge-cyan">${p(l)}</span>`).join("")}
    </div>
    <div class="findings">
      <div class="field-label" style="margin: 0 0 var(--space-3);">Findings</div>
      ${g}
    </div>
    <div class="receipt">
      <div class="field-label" style="margin: 0 0 var(--space-2);">Receipt · tamper-evident</div>
      <code>${p(e.receipt_hash)}</code>
    </div>
  `}function L(e){const t=document.getElementById("verdict-empty"),a=document.getElementById("verdict-body"),s=document.getElementById("verdict-badge");s.className="badge badge-danger",s.textContent="error",t.style.display="flex",a.style.display="none",t.innerHTML=`
    <div class="score-ring ring-empty"><span>!</span></div>
    <p class="body-sm" style="color: var(--danger);">${p(e)}</p>
  `}function te(){var s,n;const e=document.getElementById("audit-diff"),t=document.getElementById("audit-body"),a=document.getElementById("run-audit");return(s=document.getElementById("load-theater"))==null||s.addEventListener("click",()=>{e.value=Q,t.value="Added tests and authentication for the login flow.",e.focus()}),(n=document.getElementById("load-clean"))==null||n.addEventListener("click",()=>{e.value=X,t.value="Added a guard for empty tokens.",e.focus()}),a.addEventListener("click",async()=>{const i=e.value.trim();if(!i){L("Paste a diff first — the referee audits the exact input you give it.");return}a.disabled=!0,a.textContent="Auditing…";const d=document.getElementById("verdict-badge");d.className="badge badge-cyan",d.textContent="running";try{const o=await O(i,t.value);ee(o)}catch(o){L(o.message)}finally{a.disabled=!1,a.textContent="Run Referee"}}),()=>{}}function ae(){return`
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
  `}function f(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}function se(e){return new Date(e).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}function ne(e,t){const a=document.getElementById("standings-body"),s=document.getElementById("league-count");if(s.textContent=`${t} record${t!==1?"s":""}`,s.className="badge badge-neutral",!e.length){a.innerHTML='<tr><td colspan="7" class="table-empty">No matches yet — run one in the Arena.</td></tr>';return}a.innerHTML=e.map((n,i)=>`
    <tr class="${i<3?"podium":""}">
      <td class="rank">${String(i+1).padStart(2,"0")}</td>
      <td class="fleet-name">${f(n.name)}</td>
      <td class="elo">${Math.round(n.elo)}</td>
      <td class="col-w">${n.wins}</td>
      <td class="col-l">${n.losses}</td>
      <td class="col-d">${n.draws}</td>
      <td>${n.matches}</td>
    </tr>
  `).join("")}function ie(e,t){return e==="audit"?t==="clean"?'<span class="badge badge-ok">clean</span>':'<span class="badge badge-danger">blocked</span>':t==="Fleet A"?'<span class="badge badge-fleet-a">Fleet A</span>':t==="Fleet B"?'<span class="badge badge-fleet-b">Fleet B</span>':'<span class="badge badge-neutral">draw</span>'}function de(e){const t=document.getElementById("history-list");if(!e.length){t.innerHTML='<li class="history-empty">No activity yet.</li>';return}t.innerHTML=e.map(a=>`
    <li class="history-item">
      <div class="history-head">
        <span>${se(a.created_at)} · ${f(a.kind)}</span>
        ${ie(a.kind,a.winner)}
      </div>
      <div class="history-match">
        <span>${f(a.fleet_a)}</span>
        <span class="history-score">${Math.round(a.score_a)} : ${Math.round(a.score_b)}</span>
        <span>${f(a.fleet_b)}</span>
      </div>
      <p class="history-sum">${f(a.summary)}</p>
    </li>
  `).join("")}function ce(){var t;async function e(){try{const[a,s]=await Promise.all([P(),j()]);ne(a.standings,a.matches),de(s.history)}catch{const a=document.getElementById("standings-body");a.innerHTML='<tr><td colspan="7" class="table-empty">Could not reach the league store.</td></tr>'}}return(t=document.getElementById("refresh-league"))==null||t.addEventListener("click",e),e(),()=>{}}const k=new Map,$=[],S=["working","ci_failed","review_pending","mergeable","merged"];let v=null;function le(){return`
    <div class="overlay" id="overlay">
      <header class="ov-top">
        <div class="ov-brand">AO<span>▲</span>ARENA</div>
        <div class="ov-title">SEASON 0 · ROUND 1 · HONEST VS DISHONEST</div>
        <div class="ov-live"><span class="live-dot" aria-hidden="true"></span> LIVE</div>
      </header>

      <div class="ov-score">
        <div class="ov-fleet a">
          <div class="ov-fleet-name">Fleet A <span>· dishonest</span></div>
          <div class="ov-score-num" id="ov-score-a">0</div>
          <div class="ov-fleet-state" id="ov-state-a">idle</div>
        </div>
        <div class="ov-vs">VS</div>
        <div class="ov-fleet b">
          <div class="ov-fleet-name">Fleet B <span>· honest</span></div>
          <div class="ov-score-num" id="ov-score-b">0</div>
          <div class="ov-fleet-state" id="ov-state-b">idle</div>
        </div>
      </div>

      <div class="ov-boards">
        <section class="ov-board">
          <div class="ov-board-head"><span>FLEET A · WORKTREE</span><span id="ov-count-a">0 cards</span></div>
          <div class="ov-lanes" id="ov-lanes-a"></div>
        </section>
        <section class="ov-board">
          <div class="ov-board-head"><span>FLEET B · WORKTREE</span><span id="ov-count-b">0 cards</span></div>
          <div class="ov-lanes" id="ov-lanes-b"></div>
        </section>
      </div>

      <footer class="ov-ticker">
        <div class="ov-ticker-label">REFEREE EVIDENCE</div>
        <div class="ov-ticker-track" id="ov-ticker-track">
          <span class="ticker-item">awaiting first finding…</span>
        </div>
      </footer>
    </div>
  `}function re(){["a","b"].forEach(e=>{const t=document.getElementById(`ov-lanes-${e}`);t.innerHTML=S.map(a=>`
      <div class="ov-lane" data-lane="${a}">
        <div class="ov-lane-label">${C[a]}</div>
        <div class="ov-lane-cards" id="ov-lane-${e}-${a}">0</div>
      </div>`).join("")})}function oe(e){const t=[...k.values()].filter(s=>s.fleet===e),a=document.getElementById(`ov-count-${e}`);a.textContent=`${t.length} card${t.length!==1?"s":""}`,S.forEach(s=>{const n=document.getElementById(`ov-lane-${e}-${s}`);n.textContent=String(t.filter(i=>i.status===s).length)})}function ve(){const e=document.getElementById("ov-ticker-track"),t=$.slice(-12).map(a=>`<span class="ticker-item ${a.severity==="critical"?"crit":""}">[${a.severity}] ${a.category} · ${a.message}</span>`).join("");t&&(e.innerHTML=t+t)}function ue(){return re(),v=B(),v.onSession(e=>{k.set(e.id,e),oe(e.fleet)}),v.onReferee(e=>{if($.push(e),ve(),e.fleet==="a"||e.fleet==="b"){const t=document.getElementById(`ov-state-${e.fleet}`);t.textContent=e.severity==="critical"?"caught · blocked":"verified"}}),v.onScore((e,t)=>{h(document.getElementById("ov-score-a"),Math.round(e),900),h(document.getElementById("ov-score-b"),Math.round(t),900)}),v.onStatus(e=>{(e==null?void 0:e.status)==="running"&&(document.getElementById("ov-state-a").textContent="working",document.getElementById("ov-state-b").textContent="working")}),v.start(),fetch("/api/match/status").then(e=>e.json()).then(e=>{(e==null?void 0:e.status)==="complete"&&(h(document.getElementById("ov-score-a"),Math.round(e.fleet_a.trust_score),900),h(document.getElementById("ov-score-b"),Math.round(e.fleet_b.trust_score),900),document.getElementById("ov-state-a").textContent=e.fleet_a.tests_pass?"verified":"caught · blocked",document.getElementById("ov-state-b").textContent=e.fleet_b.tests_pass?"verified":"caught · blocked")}).catch(()=>{}),()=>{v==null||v.stop(),v=null,k.clear(),$.length=0}}const pe={landing:{render:()=>F()},arena:{render:D,mount:Y},audit:{render:Z,mount:te},league:{render:ae,mount:ce},overlay:{render:le,mount:ue,bare:!0}},I=document.getElementById("app");let M="landing",m=null;function ge(){return`
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
  `}function E(e){m==null||m(),m=null,M=e;const t=pe[e];I.innerHTML=(t.bare?"":ge())+t.render(),document.querySelectorAll("[data-nav]").forEach(s=>{s.addEventListener("click",()=>E(s.dataset.nav))}),document.querySelectorAll(".nav-link").forEach(s=>{s.classList.toggle("active",s.dataset.nav===e)}),t.mount&&(m=t.mount()??null),document.querySelectorAll(".reveal").forEach((s,n)=>{s.style.setProperty("--reveal-delay",`${Math.min(n,8)*60}ms`)}),_(I),location.hash!==`#${e}`&&history.pushState({view:e},"",e==="landing"?"#":`#${e}`)}function T(){const e=location.hash.replace(/^#/,"");return["arena","audit","league","overlay"].includes(e)?e:"landing"}window.addEventListener("popstate",()=>E(T()));E(T());window.aoArena={navigate:E,get view(){return M}};
//# sourceMappingURL=index-BdgTnLgV.js.map
