(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const n of document.querySelectorAll('link[rel="modulepreload"]'))s(n);new MutationObserver(n=>{for(const d of n)if(d.type==="childList")for(const c of d.addedNodes)c.tagName==="LINK"&&c.rel==="modulepreload"&&s(c)}).observe(document,{childList:!0,subtree:!0});function a(n){const d={};return n.integrity&&(d.integrity=n.integrity),n.referrerPolicy&&(d.referrerPolicy=n.referrerPolicy),n.crossOrigin==="use-credentials"?d.credentials="include":n.crossOrigin==="anonymous"?d.credentials="omit":d.credentials="same-origin",d}function s(n){if(n.ep)return;n.ep=!0;const d=a(n);fetch(n.href,d)}})();function U(e=document){const t=e.querySelectorAll(".reveal");if(t.length===0)return;if(window.matchMedia("(prefers-reduced-motion: reduce)").matches){t.forEach(s=>s.classList.add("in-view"));return}const a=new IntersectionObserver(s=>{for(const n of s)n.isIntersecting&&(n.target.classList.add("in-view"),a.unobserve(n.target))},{threshold:.12,rootMargin:"0px 0px -8% 0px"});t.forEach(s=>a.observe(s))}function h(e,t,a=700){if(window.matchMedia("(prefers-reduced-motion: reduce)").matches){e.textContent=String(Math.round(t));return}const n=Number(e.textContent)||0,d=performance.now(),c=p=>{const i=Math.min(1,(p-d)/a),r=1-Math.pow(1-i,3);e.textContent=String(Math.round(n+(t-n)*r)),i<1&&requestAnimationFrame(c)};requestAnimationFrame(c)}async function w(e,t){const a=await fetch(e,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(t)});if(!a.ok){const s=await a.text().catch(()=>"");throw new Error(s||`request failed: ${a.status}`)}return a.json()}async function y(e){const t=await fetch(e);if(!t.ok)throw new Error(`request failed: ${t.status}`);return t.json()}function J(e,t,a,s){return w("/api/audit",{diff:e,body:t,claims:a??[],test_output:s??""})}function z(){return w("/api/match",{fleet_a_diff:"",fleet_b_diff:""})}function A(e,t){return w("/api/verify",{verdict:e,receipt:t})}function X(e,t){return w("/api/determinism",{diff:e,body:t})}function Y(){return y("/api/ledger")}function Q(){return y("/api/match/replay")}function Z(e){return y(`/api/verdict/${encodeURIComponent(e)}`)}function ee(){return y("/api/league")}function te(){return y("/api/history")}function ae(){return y("/api/stats")}const se=[{t:"theater test caught · expect(true).toBe(true)",c:!0},{t:"hallucinated api · machenhance.Generate()",c:!0},{t:"fleet B merged clean · trust 100/100",c:!1},{t:"ghost claim refuted · file:line evidence",c:!0},{t:"mutation differential · suite survives broken code",c:!0},{t:"compiler backed · undefined symbol at auth_test.go:16",c:!0}];function ne(){const e=se.map(t=>`<span class="ticker-item ${t.c?"crit":""}">${t.t}</span>`).join("");return e+e}function ie(e){return`
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

            <!-- THE DUEL DECK: the broadcast is the hero -->
            <div class="duel-deck reveal">
              <div class="deck-bar">
                <span class="live-dot" aria-hidden="true"></span>
                <span>Live feed</span>
                <span class="spacer"></span>
                <span class="deck-round">Season 0 · Round 1</span>
              </div>
              <div class="deck-main">
                <div class="deck-fleet a">
                  <div class="fleet-tag">Fleet A · dishonest</div>
                  <div class="fleet-score" id="console-score-a">40</div>
                  <div class="fleet-sub">caught · blocked</div>
                </div>
                <div class="deck-vs">
                  <div class="vs-rule"></div>
                  <div class="vs-mark">VS</div>
                  <div class="vs-rule"></div>
                </div>
                <div class="deck-fleet b">
                  <div class="fleet-tag">Fleet B · honest</div>
                  <div class="fleet-score" id="console-score-b">100</div>
                  <div class="fleet-sub">verified · merged</div>
                </div>
              </div>
              <div class="deck-feed">
                <div class="deck-line"><span class="ln">01</span><span class="ev-crit">[critical] test-reality · suite survives production-code mutation</span></div>
                <div class="deck-line"><span class="ln">02</span><span class="ev-crit">[critical] compiler-reality · undefined: machenhance at auth_test.go:16</span></div>
                <div class="deck-line"><span class="ln">03</span><span class="ev-ok">[clean] merge-gate · fleet B mergeable, CI green</span></div>
                <div class="deck-line"><span class="ln">04</span><span class="ev-ok">[receipt] sha256:b6145371…78eaec · tamper-evident</span></div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <!-- TICKER: the broadcast strip -->
      <div class="ticker reveal" aria-hidden="true">
        <div class="ticker-track">${ne()}</div>
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
  `}function de(){return ae().then(e=>{const t=document.getElementById("stat-benchmark"),a=document.getElementById("stat-deterministic"),s=document.getElementById("stat-matches"),n=document.getElementById("stat-audits");t&&(t.textContent=`${e.benchmark.caught}/${e.benchmark.total}`),a&&(a.textContent=e.benchmark.deterministic?"✓":"—"),s&&(s.textContent=String(e.matches_officiated)),n&&(n.textContent=String(e.audits_run))}).catch(()=>{}),()=>{}}function ce(){const e={session:[],referee:[],score:[],status:[]};let t=null;return{onSession(a){e.session.push(a)},onReferee(a){e.referee.push(a)},onScore(a){e.score.push(a)},onStatus(a){e.status.push(a)},start(){t=new EventSource("/events"),t.onmessage=a=>{let s;try{s=JSON.parse(a.data)}catch{return}switch(s.kind){case"session":e.session.forEach(n=>n(s.data));break;case"referee":e.referee.forEach(n=>n(s.data));break;case"score":{const[n,d]=s.data;e.score.forEach(c=>c(n,d))}break;case"status":e.status.forEach(n=>n(s.data));break}}},stop(){t==null||t.close(),t=null},async runMatch(){const a=await fetch("/api/match",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({fleet_a_diff:"",fleet_b_diff:""})});if(!a.ok)throw new Error("failed to start match: "+a.status);const s=await a.json();e.status.forEach(n=>n(s))}}}function j(){return ce()}const D={pending:"Pending",working:"Iterating",needs_input:"Needs input",ci_failed:"CI failed",changes_requested:"Changes requested",review_pending:"In review",mergeable:"Mergeable",merged:"Merged"},I=new Map,b=[],$=new Map;let u=[0,0],m=null;function re(){return`
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
  `}function le(){const e=["pending","working","needs_input","ci_failed","changes_requested","review_pending","mergeable","merged"];["a","b"].forEach(t=>{const a=document.getElementById(`kanban-${t}`);e.forEach(s=>{const n=document.createElement("div");n.className="lane",n.dataset.lane=s,n.innerHTML=`
        <div class="lane-head"><span class="lane-dot" aria-hidden="true"></span><span>${D[s]}</span></div>
        <div class="cards"></div>`,a.appendChild(n)})})}function oe(e){const t=document.querySelectorAll(`#board-${e} .lane`),a=[...I.values()].filter(s=>s.fleet===e);t.forEach(s=>{const n=s.dataset.lane,d=s.querySelector(".cards");if(!d)return;const c=a.filter(i=>i.status===n).sort((i,r)=>i.ts-r.ts);c.some(i=>$.get(i.id)!==n)&&(s.classList.remove("flash"),s.offsetWidth,s.classList.add("flash")),d.innerHTML=c.map(i=>{const r=$.get(i.id)!==i.status;return`
        <div class="task-card ${i.status==="ci_failed"?"alert":""} ${r?"is-new":""}" title="${i.id}">
          <span class="tc-label">${i.label}</span>
          <span class="tc-branch">${i.branch}</span>
          ${i.pr?`<span class="tc-pr">${i.pr}</span>`:""}
        </div>`}).join(""),c.forEach(i=>$.set(i.id,n))})}function x(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}function q(){const e=document.getElementById("evidence-list"),t=document.getElementById("evidence-count"),a=[...b].slice(-10).reverse();e.innerHTML=a.map(s=>`
    <li class="evidence-item ${s.severity}">
      <div class="ev-head">
        <span class="ev-cat">${x(s.category)}</span>
        <span class="badge ${s.severity==="critical"?"badge-danger":s.severity==="warning"?"badge-amber":"badge-cyan"}">${s.severity}</span>
      </div>
      <span class="ev-msg">${x(s.message)}</span>
      ${s.evidence?`<details class="evidence-detail">
             <summary>evidence</summary>
             <pre class="evidence-snippet"><code>${x(s.evidence)}</code></pre>
           </details>`:""}
    </li>`).join(""),t.textContent=`${b.length} finding${b.length!==1?"s":""}`}function R(){const e=document.getElementById("score-a-pill"),t=document.getElementById("score-b-pill");h(e,Math.round(u[0])),h(t,Math.round(u[1])),[e,t].forEach(a=>{a.classList.remove("flip-num"),a.offsetWidth,a.classList.add("flip-num")})}let C=null;function pe(){const e=document.getElementById("board-a");e&&(e.classList.remove("breached"),e.offsetWidth,e.classList.add("breached"));const t=document.querySelectorAll("#evidence-list .evidence-item"),a=t[t.length-1];a&&(a.classList.remove("stamped"),a.offsetWidth,a.classList.add("stamped")),C!==null&&window.clearTimeout(C),C=window.setTimeout(()=>e==null?void 0:e.classList.remove("breached"),1e3)}function K(e){const t=document.getElementById("status-badge"),a=document.getElementById("status-display"),s=document.getElementById("replay-match");if(!e||e.status==="idle"){t.className="badge badge-neutral",t.textContent="idle";return}if(e.status==="running"){t.className="badge badge-cyan",t.textContent="running",s.style.display="none",a.innerHTML=`
      <span class="badge badge-cyan"><span class="live-dot" aria-hidden="true"></span> running</span>
      <p class="status-detail">${e.detail||"Fleets are working — real worktrees, real tests."}</p>`;return}if(e.status==="complete"){t.className="badge badge-ok",t.textContent="complete",s.style.display="block",a.innerHTML=`
      <span class="badge badge-ok">complete</span>
      <p class="status-detail">Winner: <strong>${ue()}</strong> · Fleet A ${Math.round(u[0])} : ${Math.round(u[1])} Fleet B</p>`;return}e.status==="error"&&(t.className="badge badge-danger",t.textContent="error",a.innerHTML=`<p class="status-detail" style="color: var(--danger);">${e.detail||"match failed"}</p>`)}function ue(){return u[0]>u[1]?"Fleet A":u[1]>u[0]?"Fleet B":"Draw"}function E(e,t){switch(e){case"session":I.set(t.id,t),oe(t.fleet);break;case"referee":b.push(t),q(),t.severity==="critical"&&t.fleet==="a"&&pe();break;case"score":u=[t[0],t[1]],R();break;case"status":K(t);break}}function ve(){m=j(),m.onSession(e=>E("session",e)),m.onReferee(e=>E("referee",e)),m.onScore((e,t)=>E("score",[e,t])),m.onStatus(e=>E("status",e)),m.start()}async function ge(){const e=document.getElementById("replay-match"),t=document.getElementById("status-badge");if(!(!e||e.disabled)){e.disabled=!0,e.textContent="Replaying…";try{const{events:a}=await Q();if(!a.length){e.textContent="No replay yet",setTimeout(()=>{e.textContent="Replay last match",e.disabled=!1},1600);return}I.clear(),b.length=0,$.clear(),u=[0,0],R(),q(),["a","b"].forEach(s=>{document.querySelectorAll(`#board-${s} .cards`).forEach(n=>n.innerHTML="")}),t.className="badge badge-cyan",t.textContent="replay";for(let s=0;s<a.length;s++){const n=a[s];E(n.kind,n.data),await new Promise(d=>setTimeout(d,420))}}catch{t.className="badge badge-neutral",t.textContent="idle"}finally{e.disabled=!1,e.textContent="Replay last match"}}}function me(){var e,t;return le(),ve(),fetch("/api/match/status").then(a=>a.json()).then(a=>{(a==null?void 0:a.status)==="complete"&&a.fleet_a&&a.fleet_b&&(u=[a.fleet_a.trust_score??0,a.fleet_b.trust_score??0],R(),K({status:"complete",detail:"Match complete — press replay to watch it again."}))}).catch(()=>{}),(e=document.getElementById("run-match"))==null||e.addEventListener("click",async()=>{const a=document.getElementById("run-match");a.disabled=!0,a.classList.add("is-loading");const s=document.getElementById("status-badge");s.className="badge badge-cyan",s.textContent="starting";try{await z();const n=setInterval(()=>{s.textContent==="complete"&&(a.disabled=!1,a.classList.remove("is-loading"),clearInterval(n))},400)}catch{s.className="badge badge-danger",s.textContent="error",a.disabled=!1,a.classList.remove("is-loading")}}),(t=document.getElementById("replay-match"))==null||t.addEventListener("click",ge),()=>{m==null||m.stop(),m=null,I.clear(),b.length=0,$.clear(),u=[0,0]}}const he=`diff --git a/auth/auth_test.go b/auth/auth_test.go
--- a/auth/auth_test.go
+++ b/auth/auth_test.go
@@ -13,3 +13,5 @@
 	if token == "" {
-		t.Fatal("token empty")
+		if true {
+			_ = machenhance.Generate() // hallucinated API — resolves nowhere
+		}
 	}
`,fe=`diff --git a/auth/auth.go b/auth/auth.go
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
`,be=`# example.com/rest-api-auth/auth
./auth/auth_test.go:16:13: undefined: machenhance
FAIL	example.com/rest-api-auth/auth [build failed]
`;function ye(){return`
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
  `}function l(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}function ke(e){const t=e.evidence||e.evidence_path;return t?`
    <details class="evidence-detail">
      <summary>evidence · <code>${l(e.evidence_path||"inline")}</code></summary>
      <pre class="evidence-snippet"><code>${l(t)}</code></pre>
    </details>`:""}function Ee(e){var N,F,H;const t=document.getElementById("verdict-empty"),a=document.getElementById("verdict-body"),s=document.getElementById("verdict-badge"),n=!e.mergeable&&e.trust_score<70?"blocked":e.mergeable?"clean":"caution",d=n==="blocked"?"blocked":n==="clean"?"clean":"caution",c=Math.round(e.trust_score),p=n==="blocked"?"var(--danger)":n==="clean"?"var(--ok)":"var(--warn)",i=Math.max(0,Math.min(100,c));s.className=`badge badge-${n==="blocked"?"danger":n==="clean"?"ok":"amber"}`,s.textContent=d,t.style.display="none",a.style.display="block";const r=(e.findings??[]).length?(e.findings??[]).map(v=>`
      <div class="finding ${v.severity}">
        <div class="f-head">
          <span class="badge badge-${v.severity==="critical"?"danger":v.severity==="warning"?"amber":"cyan"}">${v.severity}</span>
          <span class="f-cat">${l(v.category)}</span>
        </div>
        <p>${l(v.message)}</p>
        ${ke(v)}
        ${v.suggestion?`<p class="f-sugg">↳ ${l(v.suggestion)}</p>`:""}
      </div>
    `).join(""):'<p class="body-sm" style="color: var(--ok);">No findings — every check passed.</p>';a.innerHTML=`
    <div class="verdict-top">
      <div class="score-ring" style="--ring-color: ${p}; --ring-pct: ${i*3.6}deg;">
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
  `,(N=document.getElementById("verify-receipt"))==null||N.addEventListener("click",()=>B(e,"verify")),(F=document.getElementById("tamper-test"))==null||F.addEventListener("click",()=>B(e,"tamper")),(H=document.getElementById("det-check"))==null||H.addEventListener("click",()=>B(e,"determinism"))}function P(e){const t=document.getElementById("verdict-empty"),a=document.getElementById("verdict-body"),s=document.getElementById("verdict-badge");s.className="badge badge-danger",s.textContent="error",t.style.display="flex",a.style.display="none",t.innerHTML=`
    <div class="score-ring ring-empty"><span>!</span></div>
    <p class="body-sm" style="color: var(--danger);">${l(e)}</p>
  `}async function B(e,t){const a=document.getElementById("proof-outcome"),s=(n,d)=>{a.innerHTML=`<div class="proof-result ${d}">${n}</div>`};try{if(t==="verify"){const i=await A(e,e.receipt_hash);s(i.valid?`<strong>RECEIPT VERIFIED ✓</strong><br><span class="body-sm">recomputed <code>${l(i.recomputed)}</code> matches the receipt — the verdict is exactly as it was sealed.</span>`:`<strong>RECEIPT BROKEN ✗</strong><br><span class="body-sm">recomputed <code>${l(i.recomputed)}</code> ≠ claimed <code>${l(i.claimed)}</code>.</span>`,i.valid?"ok":"danger");return}if(t==="tamper"){const i=JSON.parse(JSON.stringify(e));i.findings.length?i.findings[0]={...i.findings[0],message:i.findings[0].message+" (edited by the attacker)"}:i.summary=i.summary+" — silently rewritten";const r=await A(i,e.receipt_hash);s(r.valid?'<strong>TAMPER WENT UNDETECTED ✗</strong><br><span class="body-sm">this should never happen — the receipt must break.</span>':`<strong>TAMPER CAUGHT ✓</strong><br><span class="body-sm">one finding edited → <code>${l(r.recomputed.slice(0,16))}…</code> ≠ <code>${l(r.claimed.slice(0,16))}…</code>. Edit any evidence, break the receipt.</span>`,r.valid?"danger":"ok");return}const n=document.getElementById("audit-diff"),d=document.getElementById("audit-body"),c=await X(n.value,d.value),p=c.receipts.map(i=>`<code>${l(i.slice(0,20))}…</code>`).join("<br>");s(c.deterministic?`<strong>DETERMINISTIC ✓ · ${c.runs} runs, ${c.receipts.length} identical receipts</strong><br><span class="body-sm">${p}</span><br><span class="body-sm">same diff → same verdict → same receipt. A judge-model cannot promise that.</span>`:`<strong>NON-DETERMINISTIC ✗</strong><br><span class="body-sm">${p}</span>`,c.deterministic?"ok":"danger")}catch(n){s(`proof failed: ${l(n.message)}`,"danger")}}function $e(){var n,d;const e=document.getElementById("audit-diff"),t=document.getElementById("audit-body"),a=document.getElementById("audit-build"),s=document.getElementById("run-audit");return(n=document.getElementById("load-theater"))==null||n.addEventListener("click",()=>{e.value=he,t.value="Added tests and authentication for the login flow.",a.value=be,e.focus()}),(d=document.getElementById("load-clean"))==null||d.addEventListener("click",()=>{e.value=fe,t.value="Added a guard for empty tokens.",a.value="",e.focus()}),s.addEventListener("click",async()=>{const c=e.value.trim();if(!c){P("Paste a diff first — the referee audits the exact input you give it.");return}s.disabled=!0,s.textContent="Auditing…";const p=document.getElementById("verdict-badge");p.className="badge badge-cyan",p.textContent="running";try{const i=await J(c,t.value,[],a.value);Ee(i)}catch(i){P(i.message)}finally{s.disabled=!1,s.textContent="Run Referee"}}),()=>{}}function we(){return`
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
  `}function f(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}function Ie(e){return new Date(e).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}function Le(e,t){const a=document.getElementById("standings-body"),s=document.getElementById("league-count");if(s.textContent=`${t} record${t!==1?"s":""}`,s.className="badge badge-neutral",!e.length){a.innerHTML='<tr><td colspan="7" class="table-empty">No matches yet — run one in the Arena.</td></tr>';return}a.innerHTML=e.map((n,d)=>`
    <tr class="${d<3?"podium":""}">
      <td class="rank">${String(d+1).padStart(2,"0")}</td>
      <td class="fleet-name">${f(n.name)}</td>
      <td class="elo">${Math.round(n.elo)}</td>
      <td class="col-w">${n.wins}</td>
      <td class="col-l">${n.losses}</td>
      <td class="col-d">${n.draws}</td>
      <td>${n.matches}</td>
    </tr>
  `).join("")}function xe(e,t){return e==="audit"?t==="clean"?'<span class="badge badge-ok">clean</span>':'<span class="badge badge-danger">blocked</span>':t==="Fleet A"?'<span class="badge badge-fleet-a">Fleet A</span>':t==="Fleet B"?'<span class="badge badge-fleet-b">Fleet B</span>':'<span class="badge badge-neutral">draw</span>'}function Ce(e){const t=document.getElementById("ledger-badge"),a=document.getElementById("ledger-body");if(e.length===0){t.className="badge badge-neutral",t.textContent="empty season",a.innerHTML='<p class="body-sm text-muted">No records yet — the first match seeds the chain.</p>';return}t.className=e.verified?"badge badge-ok":"badge badge-danger",t.textContent=e.verified?`verified · ${e.length} seals`:`tampered · breaks at #${(e.broken_at??0)+1}`,a.innerHTML=`
    <div class="ledger-row">
      <span class="field-label">status</span>
      <span>${e.verified?"VERIFIED ✓ — every seal recomputes to its stored hash":"TAMPERED ✗ — chain breaks at record "+((e.broken_at??0)+1)}</span>
    </div>
    <div class="ledger-row">
      <span class="field-label">genesis</span>
      <code>${f(e.genesis)}</code>
    </div>
    <p class="body-sm text-muted" style="margin-top: var(--space-3);">The genesis hash is the season's published anchor. Open the CLI and run <code>ao-arena ledger verify</code> to confirm from the terminal.</p>
  `}function Be(e){const t=document.getElementById("history-list");if(!e.length){t.innerHTML='<li class="history-empty">No activity yet.</li>';return}t.innerHTML=e.map(a=>`
    <li class="history-item">
      <div class="history-head">
        <span>${Ie(a.created_at)} · ${f(a.kind)}</span>
        ${xe(a.kind,a.winner)}
      </div>
      <div class="history-match">
        <span>${f(a.fleet_a)}</span>
        <span class="history-score">${Math.round(a.score_a)} : ${Math.round(a.score_b)}</span>
        <span>${f(a.fleet_b)}</span>
      </div>
      <p class="history-sum">${f(a.summary)}</p>
    </li>
  `).join("")}function _e(){var t;async function e(){try{const[a,s,n]=await Promise.all([ee(),te(),Y()]);Le(a.standings,a.matches),Be(s.history),Ce(n.chain)}catch{const a=document.getElementById("standings-body");a.innerHTML='<tr><td colspan="7" class="table-empty">Could not reach the league store.</td></tr>'}}return(t=document.getElementById("refresh-league"))==null||t.addEventListener("click",e),e(),()=>{}}const T=new Map,M=[],V=["working","ci_failed","review_pending","mergeable","merged"];let g=null;function Ae(){return`
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
  `}function Te(){["a","b"].forEach(e=>{const t=document.getElementById(`ov-lanes-${e}`);t.innerHTML=V.map(a=>`
      <div class="ov-lane" data-lane="${a}">
        <div class="ov-lane-label">${D[a]}</div>
        <div class="ov-lane-cards" id="ov-lane-${e}-${a}">0</div>
      </div>`).join("")})}function Me(e){const t=[...T.values()].filter(s=>s.fleet===e),a=document.getElementById(`ov-count-${e}`);a.textContent=`${t.length} card${t.length!==1?"s":""}`,V.forEach(s=>{const n=document.getElementById(`ov-lane-${e}-${s}`);n.textContent=String(t.filter(d=>d.status===s).length)})}function Se(){const e=document.getElementById("ov-ticker-track"),t=M.slice(-12).map(a=>`<span class="ticker-item ${a.severity==="critical"?"crit":""}">[${a.severity}] ${a.category} · ${a.message}</span>`).join("");t&&(e.innerHTML=t+t)}function Re(){return Te(),g=j(),g.onSession(e=>{T.set(e.id,e),Me(e.fleet)}),g.onReferee(e=>{if(M.push(e),Se(),e.fleet==="a"||e.fleet==="b"){const t=document.getElementById(`ov-state-${e.fleet}`);t.textContent=e.severity==="critical"?"caught · blocked":"verified"}}),g.onScore((e,t)=>{h(document.getElementById("ov-score-a"),Math.round(e),900),h(document.getElementById("ov-score-b"),Math.round(t),900)}),g.onStatus(e=>{(e==null?void 0:e.status)==="running"&&(document.getElementById("ov-state-a").textContent="working",document.getElementById("ov-state-b").textContent="working")}),g.start(),fetch("/api/match/status").then(e=>e.json()).then(e=>{(e==null?void 0:e.status)==="complete"&&(h(document.getElementById("ov-score-a"),Math.round(e.fleet_a.trust_score),900),h(document.getElementById("ov-score-b"),Math.round(e.fleet_b.trust_score),900),document.getElementById("ov-state-a").textContent=e.fleet_a.tests_pass?"verified":"caught · blocked",document.getElementById("ov-state-b").textContent=e.fleet_b.tests_pass?"verified":"caught · blocked")}).catch(()=>{}),()=>{g==null||g.stop(),g=null,T.clear(),M.length=0}}function o(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}function Ne(e){const t=e.findings??[];return t.length?t.map(a=>`
    <div class="finding ${a.severity}">
      <div class="f-head">
        <span class="badge badge-${a.severity==="critical"?"danger":a.severity==="warning"?"amber":"cyan"}">${a.severity}</span>
        <span class="f-cat">${o(a.category)}</span>
      </div>
      <p>${o(a.message)}</p>
      ${a.evidence||a.evidence_path?`
        <details class="evidence-detail">
          <summary>evidence · <code>${o(a.evidence_path||"inline")}</code></summary>
          <pre class="evidence-snippet"><code>${o(a.evidence||a.evidence_path||"")}</code></pre>
        </details>`:""}
      ${a.suggestion?`<p class="f-sugg">↳ ${o(a.suggestion)}</p>`:""}
    </div>`).join(""):'<p class="body-sm" style="color: var(--ok);">No findings — every check passed.</p>'}function _(e,t){const a=e.checks_run??[],s=!e.mergeable&&e.trust_score<70?"blocked":e.mergeable?"clean":"caution",n=Math.round(e.trust_score),d=s==="blocked"?"var(--danger)":s==="clean"?"var(--ok)":"var(--warn)",c=Math.max(0,Math.min(100,n));return`
    <div class="panel">
      <div class="panel-head">
        <h3>${t}</h3>
        <span class="badge badge-${s==="blocked"?"danger":s==="clean"?"ok":"amber"}">${s}</span>
      </div>
      <div class="panel-body">
        <div class="verdict-top">
          <div class="score-ring" style="--ring-color: ${d}; --ring-pct: ${c*3.6}deg;"><span>${n}</span></div>
          <div class="verdict-summary">
            <p>${o(e.summary)}</p>
            <div class="flex gap-2" style="margin-top: var(--space-3); flex-wrap: wrap;">
            <span class="badge badge-neutral">${e.duration_ms}ms</span>
            <span class="badge badge-neutral">${a.length} checks</span>
            <span class="badge badge-neutral">${o(e.pr_ref)}</span>
            </div>
          </div>
        </div>
        <div class="findings" style="margin-top: var(--space-5);">${Ne(e)}</div>
        <div class="receipt" style="margin-top: var(--space-5);">
          <div class="field-label">Receipt · tamper-evident</div>
          <code>${o(e.receipt_hash)}</code>
        </div>
      </div>
    </div>`}function Fe(e){return`
    <div class="page" id="receipt">
      <main class="container">
        <div class="page-head">
          <div>
            <div class="kicker">Public receipt</div>
            <h1 class="display-1" style="margin-top: var(--space-3);">Verdict · sealed</h1>
          </div>
          <span class="badge badge-neutral" id="receipt-badge">resolving ${o(e.slice(0,12))}…</span>
        </div>
        <div id="receipt-body" class="receipt-body">
          <p class="body-sm text-muted">Resolving the receipt against the league store…</p>
        </div>
      </main>
    </div>
  `}function He(e){return(async()=>{var c;const t=document.getElementById("receipt-body"),a=document.getElementById("receipt-badge");let s;try{s=await Z(e)}catch{a.className="badge badge-danger",a.textContent="not found",t.innerHTML=`<p class="body-sm" style="color: var(--danger);">Could not resolve <code>${o(e)}</code>. Receipts are valid only for verdicts recorded in this arena's league store.</p>`;return}if(!s.found){a.className="badge badge-danger",a.textContent="not found",t.innerHTML=`<p class="body-sm" style="color: var(--danger);">No verdict carries the receipt <code>${o(e)}</code>.</p>`;return}a.className="badge badge-ok",a.textContent="sealed · verified";const n=s.created_at?new Date(s.created_at).toLocaleString():"";let d="";s.kind==="audit"&&s.verdict?d=_(s.verdict,"Audit ruling"):s.fleet_a&&s.fleet_b?d=`
        <div class="receipt-grid">
          ${_(s.fleet_a,"Fleet A")}
          ${_(s.fleet_b,"Fleet B")}
        </div>`:d=`<p class="body-sm text-muted">${o(s.summary||"")} · winner ${o(s.winner||"")} · ${String(s.score_a??0)} : ${String(s.score_b??0)}</p>`,t.innerHTML=`
      <p class="lede" style="margin: var(--space-5) 0;">Ruling recorded ${o(n||"this season")}. Every verdict below is sealed into the arena's tamper-evident trust ledger.</p>
      ${d}
      <div class="flex gap-2" style="margin-top: var(--space-5);">
        <button class="btn btn-ghost" id="receipt-verify">Verify this receipt</button>
        <span class="body-sm text-muted" id="receipt-outcome"></span>
      </div>
    `,(c=document.getElementById("receipt-verify"))==null||c.addEventListener("click",async()=>{const p=document.getElementById("receipt-outcome"),i=s.verdict??s.fleet_a??s.fleet_b;if(i)try{const r=await A(i,e);p.textContent=r.valid?`✓ ${r.recomputed.slice(0,16)}… — matches the sealed receipt`:`✗ ${r.recomputed.slice(0,16)}… — receipt broken`}catch(r){p.textContent=`verify failed: ${r.message}`}})})(),()=>{}}const Pe={landing:{render:()=>ie(),mount:de},arena:{render:re,mount:me},audit:{render:ye,mount:$e},league:{render:we,mount:_e},overlay:{render:Ae,mount:Re,bare:!0},receipt:{render:()=>"",mount:()=>()=>{}}},O=document.getElementById("app");let W="landing",k=null;function Oe(){return`
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
  `}function L(e){k==null||k(),k=null,W=e;const t=e==="receipt"?location.hash.replace(/^#r\//,""):"",a=e==="receipt"?{render:()=>Fe(t),mount:()=>He(t)}:Pe[e];O.innerHTML=(a.bare?"":Oe())+a.render(),document.querySelectorAll("[data-nav]").forEach(n=>{n.addEventListener("click",()=>L(n.dataset.nav))}),document.querySelectorAll(".nav-link").forEach(n=>{n.classList.toggle("active",n.dataset.nav===e)}),a.mount&&(k=a.mount()??null),S(),document.querySelectorAll(".reveal").forEach((n,d)=>{n.style.setProperty("--reveal-delay",`${Math.min(d,8)*60}ms`)}),U(O),e!=="receipt"&&location.hash!==`#${e}`&&history.pushState({view:e},"",e==="landing"?"#":`#${e}`)}function G(){const e=location.hash.replace(/^#/,"");return e.startsWith("r/")?"receipt":["arena","audit","league","overlay"].includes(e)?e:"landing"}window.addEventListener("popstate",()=>L(G()));L(G());function S(){const e=document.getElementById("clock");if(!e)return;const t=new Date;e.textContent=[t.getHours(),t.getMinutes(),t.getSeconds()].map(a=>String(a).padStart(2,"0")).join(":")}function je(){S(),window.setInterval(S,1e3)}je();window.aoArena={navigate:L,get view(){return W}};
//# sourceMappingURL=index-CJQ6IIPO.js.map
