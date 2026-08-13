(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const n of document.querySelectorAll('link[rel="modulepreload"]'))s(n);new MutationObserver(n=>{for(const i of n)if(i.type==="childList")for(const c of i.addedNodes)c.tagName==="LINK"&&c.rel==="modulepreload"&&s(c)}).observe(document,{childList:!0,subtree:!0});function a(n){const i={};return n.integrity&&(i.integrity=n.integrity),n.referrerPolicy&&(i.referrerPolicy=n.referrerPolicy),n.crossOrigin==="use-credentials"?i.credentials="include":n.crossOrigin==="anonymous"?i.credentials="omit":i.credentials="same-origin",i}function s(n){if(n.ep)return;n.ep=!0;const i=a(n);fetch(n.href,i)}})();function W(e=document){const t=e.querySelectorAll(".reveal");if(t.length===0)return;if(window.matchMedia("(prefers-reduced-motion: reduce)").matches){t.forEach(s=>s.classList.add("in-view"));return}const a=new IntersectionObserver(s=>{for(const n of s)n.isIntersecting&&(n.target.classList.add("in-view"),a.unobserve(n.target))},{threshold:.12,rootMargin:"0px 0px -8% 0px"});t.forEach(s=>a.observe(s))}function h(e,t,a=700){if(window.matchMedia("(prefers-reduced-motion: reduce)").matches){e.textContent=String(Math.round(t));return}const n=Number(e.textContent)||0,i=performance.now(),c=o=>{const d=Math.min(1,(o-i)/a),r=1-Math.pow(1-d,3);e.textContent=String(Math.round(n+(t-n)*r)),d<1&&requestAnimationFrame(c)};requestAnimationFrame(c)}async function w(e,t){const a=await fetch(e,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(t)});if(!a.ok){const s=await a.text().catch(()=>"");throw new Error(s||`request failed: ${a.status}`)}return a.json()}async function y(e){const t=await fetch(e);if(!t.ok)throw new Error(`request failed: ${t.status}`);return t.json()}function G(e,t,a,s){return w("/api/audit",{diff:e,body:t,claims:a??[],test_output:s??""})}function U(){return w("/api/match",{fleet_a_diff:"",fleet_b_diff:""})}function _(e,t){return w("/api/verify",{verdict:e,receipt:t})}function J(e,t){return w("/api/determinism",{diff:e,body:t})}function z(){return y("/api/ledger")}function X(){return y("/api/match/replay")}function Y(e){return y(`/api/verdict/${encodeURIComponent(e)}`)}function Q(){return y("/api/league")}function Z(){return y("/api/history")}function ee(){return y("/api/stats")}const te=[{t:"theater test caught · expect(true).toBe(true)",c:!0},{t:"hallucinated api · machenhance.Generate()",c:!0},{t:"fleet B merged clean · trust 100/100",c:!1},{t:"ghost claim refuted · file:line evidence",c:!0},{t:"mutation differential · suite survives broken code",c:!0},{t:"compiler backed · undefined symbol at auth_test.go:16",c:!0}];function ae(){const e=te.map(t=>`<span class="ticker-item ${t.c?"crit":""}">${t.t}</span>`).join("");return e+e}function se(e){return`
    <div class="landing" id="landing">
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
                <span>5 checks · 0 LLM judges</span>
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
                <div class="console-line"><span class="ln">01</span><span class="ev-crit">[critical] test-reality · suite survives production-code mutation</span></div>
                <div class="console-line"><span class="ln">02</span><span class="ev-crit">[critical] compiler-reality · undefined: machenhance at auth_test.go:16</span></div>
                <div class="console-line"><span class="ln">03</span><span class="ev-ok">[clean] merge-gate · fleet B mergeable, CI green</span></div>
                <div class="console-line"><span class="ln">04</span><span class="ev-ok">[receipt] sha256:b6145371…78eaec · tamper-evident</span></div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <!-- TICKER: the broadcast strip -->
      <div class="ticker reveal" aria-hidden="true">
        <div class="ticker-track">${ae()}</div>
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
            ${[{code:"CHK/01",title:"Symbol Reality",desc:"Catches hallucinated imports and API calls that resolve to nothing. Static scan plus the Go toolchain itself — undefined symbols and missing packages reported with the compiler's own file:line evidence.",tag:"critical",tagCls:"badge-danger"},{code:"CHK/02",title:"Test Reality",desc:"Mutation-differential proof: production code is broken by real mutants, and a suite that still passes cannot detect broken behavior. expect(true).toBe(true) dies here.",tag:"critical",tagCls:"badge-danger"},{code:"CHK/03",title:"Claim vs Diff",desc:"Agent PR summaries describe work the diff doesn't contain. Ghost claims flagged with file:line evidence.",tag:"critical",tagCls:"badge-danger"},{code:"CHK/04",title:"Merge Gate",desc:"CI status, conflicts, coverage sanity. An agent PR must be merge-ready, not just green.",tag:"warning",tagCls:"badge-amber"},{code:"CHK/05",title:"Receipt",desc:"Every verdict carries a tamper-evident SHA-256 receipt over the canonical findings. Edit a verdict, break the receipt.",tag:"info",tagCls:"badge-cyan"}].map((t,a)=>`
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

      <!-- PROOF: measured numbers, computed live -->
      <section class="section" style="border-top: 1px solid var(--rule-strong);">
        <div class="container">
          <div class="section-head reveal">
            <div class="kicker">Measured, not marketed</div>
            <h2 class="display-1">The referee is a pure function of reality</h2>
            <p class="body text-muted">Every number on this page is computed by actually running the referee — the same code that officiates live matches in the arena. Nothing here is invented.</p>
          </div>
          <div class="proof-grid">
            <div class="proof-cell reveal">
              <div class="proof-num" id="stat-benchmark">—</div>
              <div class="proof-label">crafted failure modes caught</div>
              <div class="proof-sub">theater tests · hallucinated APIs · ghost claims</div>
            </div>
            <div class="proof-cell reveal" style="--reveal-delay: 70ms;">
              <div class="proof-num" id="stat-deterministic">—</div>
              <div class="proof-label">deterministic verdicts</div>
              <div class="proof-sub">same diff → same receipt hash, verified on every load</div>
            </div>
            <div class="proof-cell reveal" style="--reveal-delay: 140ms;">
              <div class="proof-num" id="stat-matches">—</div>
              <div class="proof-label">matches officiated live</div>
              <div class="proof-sub">real worktrees · real go test · real verdicts</div>
            </div>
            <div class="proof-cell reveal" style="--reveal-delay: 210ms;">
              <div class="proof-num" id="stat-audits">—</div>
              <div class="proof-label">diffs audited</div>
              <div class="proof-sub">every verdict carries a tamper-evident receipt</div>
            </div>
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
  `}function ne(){return ee().then(e=>{const t=document.getElementById("stat-benchmark"),a=document.getElementById("stat-deterministic"),s=document.getElementById("stat-matches"),n=document.getElementById("stat-audits");t&&(t.textContent=`${e.benchmark.caught}/${e.benchmark.total}`),a&&(a.textContent=e.benchmark.deterministic?"✓":"—"),s&&(s.textContent=String(e.matches_officiated)),n&&(n.textContent=String(e.audits_run))}).catch(()=>{}),()=>{}}function ie(){const e={session:[],referee:[],score:[],clock:[],status:[]};let t=null;const a=Date.now();return{onSession(s){e.session.push(s)},onReferee(s){e.referee.push(s)},onScore(s){e.score.push(s)},onClock(s){e.clock.push(s)},onStatus(s){e.status.push(s)},start(){t=new EventSource("/events"),t.onmessage=n=>{let i;try{i=JSON.parse(n.data)}catch{return}switch(i.kind){case"session":e.session.forEach(c=>c(i.data));break;case"referee":e.referee.forEach(c=>c(i.data));break;case"score":{const[c,o]=i.data;e.score.forEach(d=>d(c,o))}break;case"status":e.status.forEach(c=>c(i.data));break}};const s=window.setInterval(()=>{e.clock.forEach(n=>n(Date.now()-a))},250);t.addEventListener("close",()=>window.clearInterval(s))},stop(){t==null||t.close()},async runMatch(){const s=await fetch("/api/match",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({fleet_a_diff:"",fleet_b_diff:""})});if(!s.ok)throw new Error("failed to start match: "+s.status);const n=await s.json();e.status.forEach(i=>i(n))}}}function H(){return ie()}const P={pending:"Pending",working:"Iterating",needs_input:"Needs input",ci_failed:"CI failed",changes_requested:"Changes requested",review_pending:"In review",mergeable:"Mergeable",merged:"Merged"},I=new Map,f=[],$=new Map;let u=[0,0],g=null;function de(){return`
    <div class="page arena">
      <main class="container container-wide">
        <div class="page-head">
          <div>
            <div class="kicker">Live broadcast</div>
            <h1 class="display-1" style="margin-top: var(--space-3);">Arena · Season 0</h1>
          </div>
          <div class="flex gap-3" style="align-items: center;">
            <span class="badge badge-danger"><span class="live-dot" aria-hidden="true"></span> live</span>
            <span class="badge badge-neutral" id="spec-badge">spec rest-api-auth</span>
          </div>
        </div>

        <div class="arena-grid">
          <!-- FLEET A -->
          <section class="board a reveal" id="board-a">
            <div class="board-head">
              <div>
                <div class="fleet-name">Fleet A <span class="fleet-role">· dishonest</span></div>
              </div>
              <div class="score-pill" id="score-a-pill">0</div>
            </div>
            <div class="kanban" id="kanban-a"></div>
          </section>

          <!-- FLEET B -->
          <section class="board b reveal" id="board-b" style="--reveal-delay: 60ms;">
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
                  <p class="status-detail">The referee runs real acceptance tests in isolated worktrees and audits both deliveries.</p>
                </div>
                <button class="btn btn-accent btn-lg" id="run-match" style="width: 100%; margin-top: var(--space-4);">Run Match</button>
                <button class="btn btn-ghost btn-lg" id="replay-match" style="width: 100%; margin-top: var(--space-2); display: none;">Replay last match</button>
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
                <div class="sd-row"><span>checks</span><span id="spec-checks">5 · deterministic</span></div>
              </div>
            </section>
          </aside>
        </div>
      </main>
    </div>
  `}function ce(){const e=["pending","working","needs_input","ci_failed","changes_requested","review_pending","mergeable","merged"];["a","b"].forEach(t=>{const a=document.getElementById(`kanban-${t}`);e.forEach(s=>{const n=document.createElement("div");n.className="lane",n.dataset.lane=s,n.innerHTML=`
        <div class="lane-head"><span class="lane-dot" aria-hidden="true"></span><span>${P[s]}</span></div>
        <div class="cards"></div>`,a.appendChild(n)})})}function re(e){const t=document.querySelectorAll(`#board-${e} .lane`),a=[...I.values()].filter(s=>s.fleet===e);t.forEach(s=>{const n=s.dataset.lane,i=s.querySelector(".cards");if(!i)return;const c=a.filter(d=>d.status===n).sort((d,r)=>d.ts-r.ts);c.some(d=>$.get(d.id)!==n)&&(s.classList.remove("flash"),s.offsetWidth,s.classList.add("flash")),i.innerHTML=c.map(d=>{const r=$.get(d.id)!==d.status;return`
        <div class="task-card ${d.status==="ci_failed"?"alert":""} ${r?"is-new":""}" title="${d.id}">
          <span class="tc-label">${d.label}</span>
          <span class="tc-branch">${d.branch}</span>
          ${d.pr?`<span class="tc-pr">${d.pr}</span>`:""}
        </div>`}).join(""),c.forEach(d=>$.set(d.id,n))})}function L(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}function j(){const e=document.getElementById("evidence-list"),t=document.getElementById("evidence-count"),a=[...f].slice(-10).reverse();e.innerHTML=a.map(s=>`
    <li class="evidence-item ${s.severity}">
      <div class="ev-head">
        <span class="ev-cat">${L(s.category)}</span>
        <span class="badge ${s.severity==="critical"?"badge-danger":s.severity==="warning"?"badge-amber":"badge-cyan"}">${s.severity}</span>
      </div>
      <span class="ev-msg">${L(s.message)}</span>
      ${s.evidence?`<details class="evidence-detail">
             <summary>evidence</summary>
             <pre class="evidence-snippet"><code>${L(s.evidence)}</code></pre>
           </details>`:""}
    </li>`).join(""),t.textContent=`${f.length} finding${f.length!==1?"s":""}`}function M(){const e=document.getElementById("score-a-pill"),t=document.getElementById("score-b-pill");h(e,Math.round(u[0])),h(t,Math.round(u[1])),[e,t].forEach(a=>{a.classList.remove("score-pulse"),a.offsetWidth,a.classList.add("score-pulse")})}function D(e){const t=document.getElementById("status-badge"),a=document.getElementById("status-display"),s=document.getElementById("replay-match");if(!e||e.status==="idle"){t.className="badge badge-neutral",t.textContent="idle";return}if(e.status==="running"){t.className="badge badge-cyan",t.textContent="running",s.style.display="none",a.innerHTML=`
      <span class="badge badge-cyan"><span class="live-dot" aria-hidden="true"></span> running</span>
      <p class="status-detail">${e.detail||"Fleets are working — real worktrees, real tests."}</p>`;return}if(e.status==="complete"){t.className="badge badge-ok",t.textContent="complete",s.style.display="block",a.innerHTML=`
      <span class="badge badge-ok">complete</span>
      <p class="status-detail">Winner: <strong>${le()}</strong> · Fleet A ${Math.round(u[0])} : ${Math.round(u[1])} Fleet B</p>`;return}e.status==="error"&&(t.className="badge badge-danger",t.textContent="error",a.innerHTML=`<p class="status-detail" style="color: var(--danger);">${e.detail||"match failed"}</p>`)}function le(){return u[0]>u[1]?"Fleet A":u[1]>u[0]?"Fleet B":"Draw"}function k(e,t){switch(e){case"session":I.set(t.id,t),re(t.fleet);break;case"referee":f.push(t),j();break;case"score":u=[t[0],t[1]],M();break;case"status":D(t);break}}function oe(){g=H(),g.onSession(e=>k("session",e)),g.onReferee(e=>k("referee",e)),g.onScore((e,t)=>k("score",[e,t])),g.onClock(e=>{const t=document.getElementById("clock");if(!t)return;const a=Math.floor(e/1e3);t.textContent=`${String(Math.floor(a/60)).padStart(2,"0")}:${String(a%60).padStart(2,"0")}`}),g.onStatus(e=>k("status",e)),g.start()}async function pe(){const e=document.getElementById("replay-match"),t=document.getElementById("status-badge");if(!(!e||e.disabled)){e.disabled=!0,e.textContent="Replaying…";try{const{events:a}=await X();if(!a.length){e.textContent="No replay yet",setTimeout(()=>{e.textContent="Replay last match",e.disabled=!1},1600);return}I.clear(),f.length=0,$.clear(),u=[0,0],M(),j(),["a","b"].forEach(s=>{document.querySelectorAll(`#board-${s} .cards`).forEach(n=>n.innerHTML="")}),t.className="badge badge-cyan",t.textContent="replay";for(let s=0;s<a.length;s++){const n=a[s];k(n.kind,n.data),await new Promise(i=>setTimeout(i,420))}}catch{t.className="badge badge-neutral",t.textContent="idle"}finally{e.disabled=!1,e.textContent="Replay last match"}}}function ue(){var e,t;return ce(),oe(),fetch("/api/match/status").then(a=>a.json()).then(a=>{(a==null?void 0:a.status)==="complete"&&a.fleet_a&&a.fleet_b&&(u=[a.fleet_a.trust_score??0,a.fleet_b.trust_score??0],M(),D({status:"complete",detail:"Match complete — press replay to watch it again."}))}).catch(()=>{}),(e=document.getElementById("run-match"))==null||e.addEventListener("click",async()=>{const a=document.getElementById("run-match");a.disabled=!0,a.classList.add("is-loading");const s=document.getElementById("status-badge");s.className="badge badge-cyan",s.textContent="starting";try{await U();const n=setInterval(()=>{s.textContent==="complete"&&(a.disabled=!1,a.classList.remove("is-loading"),clearInterval(n))},400)}catch{s.className="badge badge-danger",s.textContent="error",a.disabled=!1,a.classList.remove("is-loading")}}),(t=document.getElementById("replay-match"))==null||t.addEventListener("click",pe),()=>{g==null||g.stop(),g=null,I.clear(),f.length=0,$.clear(),u=[0,0]}}const ve=`diff --git a/auth/auth_test.go b/auth/auth_test.go
--- a/auth/auth_test.go
+++ b/auth/auth_test.go
@@ -13,3 +13,5 @@
 	if token == "" {
-		t.Fatal("token empty")
+		if true {
+			_ = machenhance.Generate() // hallucinated API — resolves nowhere
+		}
 	}
`,ge=`diff --git a/auth/auth.go b/auth/auth.go
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
`,me=`# example.com/rest-api-auth/auth
./auth/auth_test.go:16:13: undefined: machenhance
FAIL	example.com/rest-api-auth/auth [build failed]
`;function he(){return`
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
              <label class="field-label" for="audit-build">Build / CI output · optional, makes symbol checks compiler-backed</label>
              <textarea id="audit-build" class="input audit-build" spellcheck="false"
                placeholder="Paste go test / go build output — undefined: X errors become compiler-reality findings with the compiler's own file:line."></textarea>
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
  `}function l(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}function be(e){const t=e.evidence||e.evidence_path;return t?`
    <details class="evidence-detail">
      <summary>evidence · <code>${l(e.evidence_path||"inline")}</code></summary>
      <pre class="evidence-snippet"><code>${l(t)}</code></pre>
    </details>`:""}function fe(e){var S,R,N;const t=document.getElementById("verdict-empty"),a=document.getElementById("verdict-body"),s=document.getElementById("verdict-badge"),n=!e.mergeable&&e.trust_score<70?"blocked":e.mergeable?"clean":"caution",i=n==="blocked"?"blocked":n==="clean"?"clean":"caution",c=Math.round(e.trust_score),o=n==="blocked"?"var(--danger)":n==="clean"?"var(--ok)":"var(--warn)",d=Math.max(0,Math.min(100,c));s.className=`badge badge-${n==="blocked"?"danger":n==="clean"?"ok":"amber"}`,s.textContent=i,t.style.display="none",a.style.display="block";const r=(e.findings??[]).length?(e.findings??[]).map(v=>`
      <div class="finding ${v.severity}">
        <div class="f-head">
          <span class="badge badge-${v.severity==="critical"?"danger":v.severity==="warning"?"amber":"cyan"}">${v.severity}</span>
          <span class="f-cat">${l(v.category)}</span>
        </div>
        <p>${l(v.message)}</p>
        ${be(v)}
        ${v.suggestion?`<p class="f-sugg">↳ ${l(v.suggestion)}</p>`:""}
      </div>
    `).join(""):'<p class="body-sm" style="color: var(--ok);">No findings — every check passed.</p>';a.innerHTML=`
    <div class="verdict-top">
      <div class="score-ring" style="--ring-color: ${o}; --ring-pct: ${d*3.6}deg;">
        <span>${c}</span>
      </div>
      <div class="verdict-summary">
        <p>${l(e.summary)}</p>
        <div class="flex gap-2" style="margin-top: var(--space-3); flex-wrap: wrap;">
          <span class="badge badge-neutral">${e.duration_ms}ms</span>
          <span class="badge badge-neutral">${e.checks_run.length} checks</span>
          <span class="badge badge-neutral">${l(e.pr_ref)}</span>
        </div>
      </div>
    </div>
    <div class="flex gap-2" style="margin: var(--space-5) 0; flex-wrap: wrap;">
      ${(e.checks_run??[]).map(v=>`<span class="badge badge-cyan">${l(v)}</span>`).join("")}
    </div>
    <div class="findings">
      <div class="field-label" style="margin: 0 0 var(--space-3);">Findings</div>
      ${r}
    </div>
    <div class="receipt">
      <div class="field-label" style="margin: 0 0 var(--space-2);">Receipt · tamper-evident</div>
      <code>${l(e.receipt_hash)}</code>
    </div>

    <div class="proof-actions">
      <button class="btn btn-ghost" id="verify-receipt">Verify receipt</button>
      <button class="btn btn-ghost" id="tamper-test">Tamper test · flip a finding</button>
      <button class="btn btn-ghost" id="det-check">Determinism · run ×5</button>
    </div>
    <div id="proof-outcome"></div>
  `,(S=document.getElementById("verify-receipt"))==null||S.addEventListener("click",()=>C(e,"verify")),(R=document.getElementById("tamper-test"))==null||R.addEventListener("click",()=>C(e,"tamper")),(N=document.getElementById("det-check"))==null||N.addEventListener("click",()=>C(e,"determinism"))}function F(e){const t=document.getElementById("verdict-empty"),a=document.getElementById("verdict-body"),s=document.getElementById("verdict-badge");s.className="badge badge-danger",s.textContent="error",t.style.display="flex",a.style.display="none",t.innerHTML=`
    <div class="score-ring ring-empty"><span>!</span></div>
    <p class="body-sm" style="color: var(--danger);">${l(e)}</p>
  `}async function C(e,t){const a=document.getElementById("proof-outcome"),s=(n,i)=>{a.innerHTML=`<div class="proof-result ${i}">${n}</div>`};try{if(t==="verify"){const d=await _(e,e.receipt_hash);s(d.valid?`<strong>RECEIPT VERIFIED ✓</strong><br><span class="body-sm">recomputed <code>${l(d.recomputed)}</code> matches the receipt — the verdict is exactly as it was sealed.</span>`:`<strong>RECEIPT BROKEN ✗</strong><br><span class="body-sm">recomputed <code>${l(d.recomputed)}</code> ≠ claimed <code>${l(d.claimed)}</code>.</span>`,d.valid?"ok":"danger");return}if(t==="tamper"){const d=JSON.parse(JSON.stringify(e));d.findings.length?d.findings[0]={...d.findings[0],message:d.findings[0].message+" (edited by the attacker)"}:d.summary=d.summary+" — silently rewritten";const r=await _(d,e.receipt_hash);s(r.valid?'<strong>TAMPER WENT UNDETECTED ✗</strong><br><span class="body-sm">this should never happen — the receipt must break.</span>':`<strong>TAMPER CAUGHT ✓</strong><br><span class="body-sm">one finding edited → <code>${l(r.recomputed.slice(0,16))}…</code> ≠ <code>${l(r.claimed.slice(0,16))}…</code>. Edit any evidence, break the receipt.</span>`,r.valid?"danger":"ok");return}const n=document.getElementById("audit-diff"),i=document.getElementById("audit-body"),c=await J(n.value,i.value),o=c.receipts.map(d=>`<code>${l(d.slice(0,20))}…</code>`).join("<br>");s(c.deterministic?`<strong>DETERMINISTIC ✓ · ${c.runs} runs, ${c.receipts.length} identical receipts</strong><br><span class="body-sm">${o}</span><br><span class="body-sm">same diff → same verdict → same receipt. A judge-model cannot promise that.</span>`:`<strong>NON-DETERMINISTIC ✗</strong><br><span class="body-sm">${o}</span>`,c.deterministic?"ok":"danger")}catch(n){s(`proof failed: ${l(n.message)}`,"danger")}}function ye(){var n,i;const e=document.getElementById("audit-diff"),t=document.getElementById("audit-body"),a=document.getElementById("audit-build"),s=document.getElementById("run-audit");return(n=document.getElementById("load-theater"))==null||n.addEventListener("click",()=>{e.value=ve,t.value="Added tests and authentication for the login flow.",a.value=me,e.focus()}),(i=document.getElementById("load-clean"))==null||i.addEventListener("click",()=>{e.value=ge,t.value="Added a guard for empty tokens.",a.value="",e.focus()}),s.addEventListener("click",async()=>{const c=e.value.trim();if(!c){F("Paste a diff first — the referee audits the exact input you give it.");return}s.disabled=!0,s.textContent="Auditing…";const o=document.getElementById("verdict-badge");o.className="badge badge-cyan",o.textContent="running";try{const d=await G(c,t.value,[],a.value);fe(d)}catch(d){F(d.message)}finally{s.disabled=!1,s.textContent="Run Referee"}}),()=>{}}function Ee(){return`
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

          <section class="panel reveal" style="--reveal-delay: 160ms; grid-column: 1 / -1;">
            <div class="panel-head">
              <h3>Trust ledger · tamper-evident season record</h3>
              <span class="badge badge-neutral" id="ledger-badge">checking…</span>
            </div>
            <div class="ledger-body" id="ledger-body">
              <p class="body-sm text-muted">Every record is chained to the one before it. Rewrite any past result — score, summary, verdict, receipt — and every seal after it breaks.</p>
            </div>
          </section>
        </div>
      </main>
    </div>
  `}function b(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}function ke(e){return new Date(e).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}function $e(e,t){const a=document.getElementById("standings-body"),s=document.getElementById("league-count");if(s.textContent=`${t} record${t!==1?"s":""}`,s.className="badge badge-neutral",!e.length){a.innerHTML='<tr><td colspan="7" class="table-empty">No matches yet — run one in the Arena.</td></tr>';return}a.innerHTML=e.map((n,i)=>`
    <tr class="${i<3?"podium":""}">
      <td class="rank">${String(i+1).padStart(2,"0")}</td>
      <td class="fleet-name">${b(n.name)}</td>
      <td class="elo">${Math.round(n.elo)}</td>
      <td class="col-w">${n.wins}</td>
      <td class="col-l">${n.losses}</td>
      <td class="col-d">${n.draws}</td>
      <td>${n.matches}</td>
    </tr>
  `).join("")}function we(e,t){return e==="audit"?t==="clean"?'<span class="badge badge-ok">clean</span>':'<span class="badge badge-danger">blocked</span>':t==="Fleet A"?'<span class="badge badge-fleet-a">Fleet A</span>':t==="Fleet B"?'<span class="badge badge-fleet-b">Fleet B</span>':'<span class="badge badge-neutral">draw</span>'}function Ie(e){const t=document.getElementById("ledger-badge"),a=document.getElementById("ledger-body");if(e.length===0){t.className="badge badge-neutral",t.textContent="empty season",a.innerHTML='<p class="body-sm text-muted">No records yet — the first match seeds the chain.</p>';return}t.className=e.verified?"badge badge-ok":"badge badge-danger",t.textContent=e.verified?`verified · ${e.length} seals`:`tampered · breaks at #${(e.broken_at??0)+1}`,a.innerHTML=`
    <div class="ledger-row">
      <span class="field-label">status</span>
      <span>${e.verified?"VERIFIED ✓ — every seal recomputes to its stored hash":"TAMPERED ✗ — chain breaks at record "+((e.broken_at??0)+1)}</span>
    </div>
    <div class="ledger-row">
      <span class="field-label">genesis</span>
      <code>${b(e.genesis)}</code>
    </div>
    <p class="body-sm text-muted" style="margin-top: var(--space-3);">The genesis hash is the season's published anchor. Open the CLI and run <code>ao-arena ledger verify</code> to confirm from the terminal.</p>
  `}function xe(e){const t=document.getElementById("history-list");if(!e.length){t.innerHTML='<li class="history-empty">No activity yet.</li>';return}t.innerHTML=e.map(a=>`
    <li class="history-item">
      <div class="history-head">
        <span>${ke(a.created_at)} · ${b(a.kind)}</span>
        ${we(a.kind,a.winner)}
      </div>
      <div class="history-match">
        <span>${b(a.fleet_a)}</span>
        <span class="history-score">${Math.round(a.score_a)} : ${Math.round(a.score_b)}</span>
        <span>${b(a.fleet_b)}</span>
      </div>
      <p class="history-sum">${b(a.summary)}</p>
    </li>
  `).join("")}function Le(){var t;async function e(){try{const[a,s,n]=await Promise.all([Q(),Z(),z()]);$e(a.standings,a.matches),xe(s.history),Ie(n.chain)}catch{const a=document.getElementById("standings-body");a.innerHTML='<tr><td colspan="7" class="table-empty">Could not reach the league store.</td></tr>'}}return(t=document.getElementById("refresh-league"))==null||t.addEventListener("click",e),e(),()=>{}}const A=new Map,T=[],q=["working","ci_failed","review_pending","mergeable","merged"];let m=null;function Ce(){return`
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
  `}function Be(){["a","b"].forEach(e=>{const t=document.getElementById(`ov-lanes-${e}`);t.innerHTML=q.map(a=>`
      <div class="ov-lane" data-lane="${a}">
        <div class="ov-lane-label">${P[a]}</div>
        <div class="ov-lane-cards" id="ov-lane-${e}-${a}">0</div>
      </div>`).join("")})}function _e(e){const t=[...A.values()].filter(s=>s.fleet===e),a=document.getElementById(`ov-count-${e}`);a.textContent=`${t.length} card${t.length!==1?"s":""}`,q.forEach(s=>{const n=document.getElementById(`ov-lane-${e}-${s}`);n.textContent=String(t.filter(i=>i.status===s).length)})}function Ae(){const e=document.getElementById("ov-ticker-track"),t=T.slice(-12).map(a=>`<span class="ticker-item ${a.severity==="critical"?"crit":""}">[${a.severity}] ${a.category} · ${a.message}</span>`).join("");t&&(e.innerHTML=t+t)}function Te(){return Be(),m=H(),m.onSession(e=>{A.set(e.id,e),_e(e.fleet)}),m.onReferee(e=>{if(T.push(e),Ae(),e.fleet==="a"||e.fleet==="b"){const t=document.getElementById(`ov-state-${e.fleet}`);t.textContent=e.severity==="critical"?"caught · blocked":"verified"}}),m.onScore((e,t)=>{h(document.getElementById("ov-score-a"),Math.round(e),900),h(document.getElementById("ov-score-b"),Math.round(t),900)}),m.onStatus(e=>{(e==null?void 0:e.status)==="running"&&(document.getElementById("ov-state-a").textContent="working",document.getElementById("ov-state-b").textContent="working")}),m.start(),fetch("/api/match/status").then(e=>e.json()).then(e=>{(e==null?void 0:e.status)==="complete"&&(h(document.getElementById("ov-score-a"),Math.round(e.fleet_a.trust_score),900),h(document.getElementById("ov-score-b"),Math.round(e.fleet_b.trust_score),900),document.getElementById("ov-state-a").textContent=e.fleet_a.tests_pass?"verified":"caught · blocked",document.getElementById("ov-state-b").textContent=e.fleet_b.tests_pass?"verified":"caught · blocked")}).catch(()=>{}),()=>{m==null||m.stop(),m=null,A.clear(),T.length=0}}function p(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}function Me(e){const t=e.findings??[];return t.length?t.map(a=>`
    <div class="finding ${a.severity}">
      <div class="f-head">
        <span class="badge badge-${a.severity==="critical"?"danger":a.severity==="warning"?"amber":"cyan"}">${a.severity}</span>
        <span class="f-cat">${p(a.category)}</span>
      </div>
      <p>${p(a.message)}</p>
      ${a.evidence||a.evidence_path?`
        <details class="evidence-detail">
          <summary>evidence · <code>${p(a.evidence_path||"inline")}</code></summary>
          <pre class="evidence-snippet"><code>${p(a.evidence||a.evidence_path||"")}</code></pre>
        </details>`:""}
      ${a.suggestion?`<p class="f-sugg">↳ ${p(a.suggestion)}</p>`:""}
    </div>`).join(""):'<p class="body-sm" style="color: var(--ok);">No findings — every check passed.</p>'}function B(e,t){const a=e.checks_run??[],s=!e.mergeable&&e.trust_score<70?"blocked":e.mergeable?"clean":"caution",n=Math.round(e.trust_score),i=s==="blocked"?"var(--danger)":s==="clean"?"var(--ok)":"var(--warn)",c=Math.max(0,Math.min(100,n));return`
    <div class="panel">
      <div class="panel-head">
        <h3>${t}</h3>
        <span class="badge badge-${s==="blocked"?"danger":s==="clean"?"ok":"amber"}">${s}</span>
      </div>
      <div class="panel-body">
        <div class="verdict-top">
          <div class="score-ring" style="--ring-color: ${i}; --ring-pct: ${c*3.6}deg;"><span>${n}</span></div>
          <div class="verdict-summary">
            <p>${p(e.summary)}</p>
            <div class="flex gap-2" style="margin-top: var(--space-3); flex-wrap: wrap;">
            <span class="badge badge-neutral">${e.duration_ms}ms</span>
            <span class="badge badge-neutral">${a.length} checks</span>
            <span class="badge badge-neutral">${p(e.pr_ref)}</span>
            </div>
          </div>
        </div>
        <div class="findings" style="margin-top: var(--space-5);">${Me(e)}</div>
        <div class="receipt" style="margin-top: var(--space-5);">
          <div class="field-label">Receipt · tamper-evident</div>
          <code>${p(e.receipt_hash)}</code>
        </div>
      </div>
    </div>`}function Se(e){return`
    <div class="page" id="receipt">
      <main class="container">
        <div class="page-head">
          <div>
            <div class="kicker">Public receipt</div>
            <h1 class="display-1" style="margin-top: var(--space-3);">Verdict · sealed</h1>
          </div>
          <span class="badge badge-neutral" id="receipt-badge">resolving ${p(e.slice(0,12))}…</span>
        </div>
        <div id="receipt-body" class="receipt-body">
          <p class="body-sm text-muted">Resolving the receipt against the league store…</p>
        </div>
      </main>
    </div>
  `}function Re(e){return(async()=>{var c;const t=document.getElementById("receipt-body"),a=document.getElementById("receipt-badge");let s;try{s=await Y(e)}catch{a.className="badge badge-danger",a.textContent="not found",t.innerHTML=`<p class="body-sm" style="color: var(--danger);">Could not resolve <code>${p(e)}</code>. Receipts are valid only for verdicts recorded in this arena's league store.</p>`;return}if(!s.found){a.className="badge badge-danger",a.textContent="not found",t.innerHTML=`<p class="body-sm" style="color: var(--danger);">No verdict carries the receipt <code>${p(e)}</code>.</p>`;return}a.className="badge badge-ok",a.textContent="sealed · verified";const n=s.created_at?new Date(s.created_at).toLocaleString():"";let i="";s.kind==="audit"&&s.verdict?i=B(s.verdict,"Audit ruling"):s.fleet_a&&s.fleet_b?i=`
        <div class="receipt-grid">
          ${B(s.fleet_a,"Fleet A")}
          ${B(s.fleet_b,"Fleet B")}
        </div>`:i=`<p class="body-sm text-muted">${p(s.summary||"")} · winner ${p(s.winner||"")} · ${String(s.score_a??0)} : ${String(s.score_b??0)}</p>`,t.innerHTML=`
      <p class="lede" style="margin: var(--space-5) 0;">Ruling recorded ${p(n||"this season")}. Every verdict below is sealed into the arena's tamper-evident trust ledger.</p>
      ${i}
      <div class="flex gap-2" style="margin-top: var(--space-5);">
        <button class="btn btn-ghost" id="receipt-verify">Verify this receipt</button>
        <span class="body-sm text-muted" id="receipt-outcome"></span>
      </div>
    `,(c=document.getElementById("receipt-verify"))==null||c.addEventListener("click",async()=>{const o=document.getElementById("receipt-outcome"),d=s.verdict??s.fleet_a??s.fleet_b;if(d)try{const r=await _(d,e);o.textContent=r.valid?`✓ ${r.recomputed.slice(0,16)}… — matches the sealed receipt`:`✗ ${r.recomputed.slice(0,16)}… — receipt broken`}catch(r){o.textContent=`verify failed: ${r.message}`}})})(),()=>{}}const Ne={landing:{render:()=>se(),mount:ne},arena:{render:de,mount:ue},audit:{render:he,mount:ye},league:{render:Ee,mount:Le},overlay:{render:Ce,mount:Te,bare:!0},receipt:{render:()=>"",mount:()=>()=>{}}},O=document.getElementById("app");let V="landing",E=null;function Fe(){return`
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
  `}function x(e){E==null||E(),E=null,V=e;const t=e==="receipt"?location.hash.replace(/^#r\//,""):"",a=e==="receipt"?{render:()=>Se(t),mount:()=>Re(t)}:Ne[e];O.innerHTML=(a.bare?"":Fe())+a.render(),document.querySelectorAll("[data-nav]").forEach(n=>{n.addEventListener("click",()=>x(n.dataset.nav))}),document.querySelectorAll(".nav-link").forEach(n=>{n.classList.toggle("active",n.dataset.nav===e)}),a.mount&&(E=a.mount()??null),document.querySelectorAll(".reveal").forEach((n,i)=>{n.style.setProperty("--reveal-delay",`${Math.min(i,8)*60}ms`)}),W(O),e!=="receipt"&&location.hash!==`#${e}`&&history.pushState({view:e},"",e==="landing"?"#":`#${e}`)}function K(){const e=location.hash.replace(/^#/,"");return e.startsWith("r/")?"receipt":["arena","audit","league","overlay"].includes(e)?e:"landing"}window.addEventListener("popstate",()=>x(K()));x(K());window.aoArena={navigate:x,get view(){return V}};
//# sourceMappingURL=index-BBdKH_CP.js.map
