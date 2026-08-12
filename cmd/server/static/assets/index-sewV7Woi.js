(function(){const a=document.createElement("link").relList;if(a&&a.supports&&a.supports("modulepreload"))return;for(const n of document.querySelectorAll('link[rel="modulepreload"]'))s(n);new MutationObserver(n=>{for(const i of n)if(i.type==="childList")for(const r of i.addedNodes)r.tagName==="LINK"&&r.rel==="modulepreload"&&s(r)}).observe(document,{childList:!0,subtree:!0});function t(n){const i={};return n.integrity&&(i.integrity=n.integrity),n.referrerPolicy&&(i.referrerPolicy=n.referrerPolicy),n.crossOrigin==="use-credentials"?i.credentials="include":n.crossOrigin==="anonymous"?i.credentials="omit":i.credentials="same-origin",i}function s(n){if(n.ep)return;n.ep=!0;const i=t(n);fetch(n.href,i)}})();function k(e){return`
    <div class="landing" id="landing">
      <!-- HERO -->
      <header class="hero">
        <div class="container">
          <div class="hero-content">
            <div class="hero-badge animate-slide-up">
              <span class="badge badge-primary">The Orchestra Hackathon • Aug 12–13</span>
            </div>
            <h1 class="display-1 animate-slide-up delay-1">
              Verification-as-officiating<br>for AI agent fleets
            </h1>
            <p class="body animate-slide-up delay-2" style="max-width: 48ch; color: var(--text-muted); margin-top: var(--space-4);">
              Agent velocity has outrun human inspection. PRs land containing hallucinated APIs,
              theater tests, and ghost claims. The Referee turns "trust me" into "show me the evidence."
            </p>
            <div class="flex gap-3 animate-slide-up delay-3" style="margin-top: var(--space-6); flex-wrap: wrap;">
              <button class="btn btn-primary" data-nav="arena">Enter the Arena</button>
              <a href="https://github.com/shashank-tomar0/ao-arena" target="_blank" class="btn btn-secondary">View on GitHub</a>
            </div>
          </div>

          <!-- Hero Visual: Mini Arena Preview -->
          <div class="hero-visual animate-scale-in delay-4" style="margin-top: var(--space-10);">
            <div class="mini-arena">
              <div class="mini-board" data-fleet="a">
                <div class="mini-header"><span class="mini-title">Fleet A</span></div>
                <div class="mini-lanes">
                  <div class="mini-lane"><span class="mini-lane-label">working</span></div>
                  <div class="mini-lane"><span class="mini-lane-label">ci_failed</span></div>
                  <div class="mini-lane"><span class="mini-lane-label">review_pending</span></div>
                  <div class="mini-lane"><span class="mini-lane-label">mergeable</span></div>
                </div>
              </div>
              <div class="mini-vs">VS</div>
              <div class="mini-board" data-fleet="b">
                <div class="mini-header"><span class="mini-title">Fleet B</span></div>
                <div class="mini-lanes">
                  <div class="mini-lane"><span class="mini-lane-label">working</span></div>
                  <div class="mini-lane"><span class="mini-lane-label">working</span></div>
                  <div class="mini-lane"><span class="mini-lane-label">review_pending</span></div>
                  <div class="mini-lane"><span class="mini-lane-label mergeable">mergeable</span></div>
                </div>
              </div>
            </div>
            <div class="mini-scoreboard">
              <div class="mini-score" style="color: var(--fleet-a)">100</div>
              <div class="mini-divider">/</div>
              <div class="mini-score" style="color: var(--fleet-b)">40</div>
            </div>
          </div>
        </div>
      </header>

      <!-- FEATURES -->
      <section class="section features">
        <div class="container">
          <div class="section-head animate-slide-up">
            <span class="caption">Core Primitives</span>
            <h2 class="display-2" style="margin-top: var(--space-2);">Deterministic verification, not LLM-as-judge</h2>
          </div>
          <div class="grid" style="grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); margin-top: var(--space-8);">
            ${[{icon:"🔍",title:"Symbol Reality",desc:"Catches hallucinated imports and API calls that resolve to nothing. Every reference verified against the actual codebase symbol graph.",tag:"Critical"},{icon:"🎭",title:"Test Reality",desc:"Mutation-differential proof: if tests pass after assertions are neutralized, the suite is theater. Catches expect(true).toBe(true) and empty test bodies.",tag:"Critical"},{icon:"👻",title:"Claim vs Diff",desc:"Agent PR summaries often describe work the diff doesn't contain. Ghost claims flagged with file:line evidence.",tag:"Critical"},{icon:"🚪",title:"Merge Gate",desc:"CI status, conflicts, coverage sanity. An agent PR must be merge-ready, not just green.",tag:"Warning"}].map((a,t)=>`
              <article class="card feature-card animate-slide-up" style="animation-delay: ${t*80}ms;">
                <div class="feature-icon">${a.icon}</div>
                <h3 class="heading-2" style="margin: var(--space-3) 0 var(--space-2);">${a.title}</h3>
                <p class="body-sm" style="color: var(--text-muted);">${a.desc}</p>
                <span class="badge badge-${a.tag.toLowerCase()}" style="margin-top: var(--space-3); display: inline-block;">${a.tag}</span>
              </article>
            `).join("")}
          </div>
        </div>
      </section>

      <!-- SPECS -->
      <section class="section specs" style="background: var(--bg-elevated);">
        <div class="container">
          <div class="section-head animate-slide-up">
            <span class="caption">Challenge Specs</span>
            <h2 class="display-2" style="margin-top: var(--space-2);">Real engineering challenges, not toy problems</h2>
          </div>
          <div class="grid" style="grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); margin-top: var(--space-8);">
            ${[{id:"rest-api-auth",name:"REST API with Auth",desc:"JWT register/login/me endpoints. Acceptance: 4 behaviors, 100% coverage target.",checks:["Symbol Reality","Test Reality","Claim vs Diff"]},{id:"realtime-chat",name:"Real-time Chat",desc:"WebSocket server with presence. Bidirectional messaging, graceful shutdown, 100ms echo.",checks:["Symbol Reality","Test Reality","Claim vs Diff"]},{id:"cli-task-tracker",name:"CLI Task Tracker",desc:"Persistent add/list/done/rm with file storage. Error paths tested, no panics.",checks:["Symbol Reality","Test Reality","Claim vs Diff"]}].map((a,t)=>`
              <article class="card spec-card animate-slide-up" style="animation-delay: ${t*80}ms;">
                <div class="spec-header">
                  <span class="caption" style="color: var(--primary);">${a.id}</span>
                  <span class="badge badge-neutral">${a.checks.length} checks</span>
                </div>
                <h3 class="heading-2" style="margin: var(--space-3) 0 var(--space-2);">${a.name}</h3>
                <p class="body-sm" style="color: var(--text-muted); margin-bottom: var(--space-4);">${a.desc}</p>
                <div class="flex gap-2 flex-wrap">
                  ${a.checks.map(s=>`<span class="badge badge-info">${s}</span>`).join("")}
                </div>
              </article>
            `).join("")}
          </div>
        </div>
      </section>

      <!-- HOW IT WORKS -->
      <section class="section how-it-works">
        <div class="container">
          <div class="section-head animate-slide-up" style="text-align: center; margin: 0 auto;">
            <span class="caption">The Flow</span>
            <h2 class="display-2" style="margin-top: var(--space-2);">From agent code to trust score in seconds</h2>
          </div>
          <div class="flow" style="display: flex; gap: var(--space-4); margin-top: var(--space-8); flex-wrap: wrap; justify-content: center;">
            ${[{step:"1",label:"Agent delivers",desc:"Code pushed to isolated worktree"},{step:"2",label:"Tests run",desc:"go test -cover in real environment"},{step:"3",label:"Referee audits",desc:"4 deterministic checks execute"},{step:"4",label:"Score computed",desc:"0–100 trust score, merge gate"},{step:"5",label:"Broadcast",desc:"Live Kanban + evidence rail"}].map((a,t)=>`
              <div class="flow-step card animate-slide-up" style="animation-delay: ${t*80}ms; min-width: 180px; max-width: 220px; text-align: center;">
                <div class="flow-step-num" style="font-size: var(--text-3xl); font-weight: 700; color: var(--primary); font-family: var(--font-display);">${a.step}</div>
                <h4 class="heading-2" style="margin: var(--space-2) 0;">${a.label}</h4>
                <p class="caption" style="color: var(--text-muted);">${a.desc}</p>
              </div>
            `).join("")}
          </div>
        </div>
      </section>

      <!-- FOOTER CTA -->
      <footer class="footer" style="background: var(--bg-elevated); border-top: 1px solid var(--border);">
        <div class="container" style="text-align: center; padding: var(--space-12) 0;">
          <h3 class="display-3">Ready to see agents compete?</h3>
          <p class="body" style="color: var(--text-muted); margin: var(--space-3) 0 var(--space-6); max-width: 40ch; margin-left: auto; margin-right: auto;">
            Built with Agent Orchestrator for The Orchestra hackathon. Real worktrees, real CI, real referee.
          </p>
          <button class="btn btn-primary btn-lg" data-nav="arena" style="padding: var(--space-3) var(--space-8); font-size: var(--text-base);">
            Enter the Arena →
          </button>
        </div>
      </footer>
    </div>
  `}async function f(e,a){const t=await fetch(e,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(a)});if(!t.ok){const s=await t.text().catch(()=>"");throw new Error(s||`request failed: ${t.status}`)}return t.json()}async function w(e){const a=await fetch(e);if(!a.ok)throw new Error(`request failed: ${a.status}`);return a.json()}function A(e,a,t){return f("/api/audit",{diff:e,body:a,claims:[]})}function C(){return f("/api/match",{fleet_a_diff:"",fleet_b_diff:""})}function L(){return w("/api/league")}function T(){return w("/api/history")}function I(){const e={session:[],referee:[],score:[],clock:[],status:[]};let a=null;const t=Date.now();return{onSession(s){e.session.push(s)},onReferee(s){e.referee.push(s)},onScore(s){e.score.push(s)},onClock(s){e.clock.push(s)},onStatus(s){e.status.push(s)},start(){a=new EventSource("/events"),a.onmessage=n=>{let i;try{i=JSON.parse(n.data)}catch{return}switch(i.kind){case"session":e.session.forEach(r=>r(i.data));break;case"referee":e.referee.forEach(r=>r(i.data));break;case"score":{const[r,d]=i.data;e.score.forEach(u=>u(r,d))}break;case"status":e.status.forEach(r=>r(i.data));break}};const s=window.setInterval(()=>{e.clock.forEach(n=>n(Date.now()-t))},250);a.addEventListener("close",()=>window.clearInterval(s))},stop(){a==null||a.close()},async runMatch(){const s=await fetch("/api/match",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({fleet_a_diff:"",fleet_b_diff:""})});if(!s.ok)throw new Error("failed to start match: "+s.status);const n=await s.json();e.status.forEach(i=>i(n))}}}function S(){return I()}const M={pending:"Pending",working:"Iterating",needs_input:"Needs input",ci_failed:"CI failed",changes_requested:"Changes requested",review_pending:"In review",mergeable:"Mergeable",merged:"Merged"},b=new Map,v=[];let c=[0,0],o=null;function B(){return`
    <div class="arena" id="arena">
      <main class="container" style="flex: 1; padding: var(--space-4); max-width: 1600px;">
        <section id="boards" class="boards">
          <div class="board" id="board-a" data-fleet="a">
            <div class="board-header">
              <h2 class="board-title">Fleet A <span class="caption" style="margin-left: var(--space-2);">dishonest</span></h2>
              <div class="score-pill" id="score-a-pill">0</div>
            </div>
            <div class="kanban" id="kanban-a"></div>
          </div>

          <div class="vs-divider">VS</div>

          <div class="board" id="board-b" data-fleet="b">
            <div class="board-header">
              <h2 class="board-title">Fleet B <span class="caption" style="margin-left: var(--space-2);">honest</span></h2>
              <div class="score-pill" id="score-b-pill">0</div>
            </div>
            <div class="kanban" id="kanban-b"></div>
          </div>
        </section>

        <aside class="sidebar">
          <section id="match-status" class="card">
            <div class="evidence-header">
              <h3 class="heading-2">Match Status</h3>
              <span class="badge badge-neutral" id="status-badge">Idle</span>
            </div>
            <div id="status-display" class="status-display">
              <p class="body-sm" style="color: var(--text-muted);">The referee runs real go test in isolated worktrees and audits both deliveries. No script, no fixtures on this path — except the honest-vs-dishonest default.</p>
            </div>
            <button class="btn btn-accent" id="run-match" style="margin-top: var(--space-4); width: 100%;">Run Match</button>
          </section>

          <section id="evidence" class="card">
            <div class="evidence-header">
              <h3 class="heading-2">Referee Evidence</h3>
              <span class="badge badge-neutral" id="evidence-count">0 findings</span>
            </div>
            <ul id="evidence-list" class="evidence-list"></ul>
          </section>

          <section id="spec-info" class="card">
            <h3 class="heading-2" style="margin-bottom: var(--space-3);">Active Spec</h3>
            <div id="spec-detail" class="spec-detail">
              <div class="spec-row"><span class="caption">ID</span><span id="spec-id">rest-api-auth</span></div>
              <div class="spec-row"><span class="caption">Description</span><span id="spec-desc">REST API with authentication</span></div>
              <div class="spec-row"><span class="caption">Checks</span><span id="spec-checks">Symbol Reality, Test Reality, Claim vs Diff, Merge Gate</span></div>
            </div>
          </section>
        </aside>
      </main>
    </div>
  `}function _(){const e=["pending","working","needs_input","ci_failed","changes_requested","review_pending","mergeable","merged"];["a","b"].forEach(a=>{const t=document.getElementById(`kanban-${a}`);e.forEach(s=>{const n=document.createElement("div");n.className="kanban",n.dataset.lane=s,n.innerHTML=`<h3>${M[s]}</h3><div class="cards"></div>`,t.appendChild(n)})})}function R(e){const a=document.querySelectorAll(`#board-${e} .kanban`),t=[...b.values()].filter(s=>s.fleet===e);a.forEach(s=>{const n=s.dataset.lane,i=s.querySelector(".cards");if(!i)return;const r=t.filter(d=>d.status===n).sort((d,u)=>d.ts-u.ts);i.innerHTML=r.map(d=>`
      <div class="card ${d.status==="ci_failed"?"alert":""} animate-scale-in" title="${d.id}" style="animation-delay: ${Math.random()*50}ms;">
        <span class="card-label">${d.label}</span>
        <span class="card-branch">${d.branch}</span>
        ${d.pr?`<span class="card-pr">${d.pr}</span>`:""}
      </div>
    `).join("")})}function N(){const e=document.getElementById("evidence-list"),a=document.getElementById("evidence-count"),t=[...v].slice(-10).reverse();e.innerHTML=t.map(s=>`
    <li class="ev ${s.severity} animate-slide-up">
      <strong>${s.category}</strong>
      <span>${s.message}</span>
      ${s.evidence?`<code>${s.evidence}</code>`:""}
    </li>
  `).join(""),a.textContent=`${v.length} finding${v.length!==1?"s":""}`}function P(){const e=document.getElementById("score-a-pill"),a=document.getElementById("score-b-pill");e.textContent=`${Math.round(c[0])}`,a.textContent=`${Math.round(c[1])}`,e.style.color=c[0]>=70?"var(--success)":c[0]>0?"var(--warning)":"var(--danger)",a.style.color=c[1]>=70?"var(--success)":c[1]>0?"var(--warning)":"var(--danger)"}function F(e){const a=document.getElementById("clock");if(!a)return;const t=Math.floor(e/1e3),s=String(Math.floor(t/60)).padStart(2,"0"),n=String(t%60).padStart(2,"0");a.textContent=`${s}:${n}`}function H(e){const a=document.getElementById("status-badge"),t=document.getElementById("status-display");if(!e||e.status==="idle"){a.className="badge badge-neutral",a.textContent="Idle",t.innerHTML='<p class="body-sm" style="color: var(--text-muted);">The referee runs real go test in isolated worktrees and audits both deliveries. No script, no fixtures on this path — except the honest-vs-dishonest default.</p>';return}if(e.status==="running"){a.className="badge badge-primary",a.textContent="Running",t.innerHTML=`<span class="badge badge-primary">Running...</span><p class="body-sm" style="color: var(--text-muted); margin-top: var(--space-2);">${e.detail||"Fleets are working..."}</p>`;return}if(e.status==="complete"){a.className="badge badge-success",a.textContent="Complete",t.innerHTML=`
      <span class="badge badge-accent">Complete — ${e.detail||"match finished"}</span>
      <div class="flex gap-2" style="margin-top: var(--space-3); flex-wrap: wrap;">
        <span class="badge badge-info">Fleet A: ${Math.round(c[0])}/100</span>
        <span class="badge badge-info">Fleet B: ${Math.round(c[1])}/100</span>
      </div>
      <p class="body-sm" style="color: var(--text-muted); margin-top: var(--space-2);">Winner: ${O()}</p>
    `;return}e.status==="error"&&(a.className="badge badge-danger",a.textContent="Error",t.innerHTML=`<span class="badge badge-danger">Error</span><p class="body-sm" style="color: var(--danger); margin-top: var(--space-2);">${e.detail||"match failed"}</p>`)}function O(){return c[0]>c[1]?"Fleet A":c[1]>c[0]?"Fleet B":"Draw"}function j(){o=S(),o.onSession(e=>{b.set(e.id,e),R(e.fleet)}),o.onReferee(e=>{v.push(e),N()}),o.onScore((e,a)=>{c=[e,a],P()}),o.onClock(e=>F(e)),o.onStatus(e=>H(e)),o.start()}function D(){var e;return _(),j(),(e=document.getElementById("run-match"))==null||e.addEventListener("click",async()=>{const a=document.getElementById("run-match");a.disabled=!0,a.textContent="Match running…";const t=document.getElementById("status-display"),s=document.getElementById("status-badge");s.className="badge badge-primary",s.textContent="Starting",t.innerHTML='<span class="badge badge-primary">Starting…</span><p class="body-sm" style="color: var(--text-muted); margin-top: var(--space-2);">Spawning worktrees, running go test, refereeing…</p>';try{await C();const n=setInterval(()=>{const i=document.getElementById("status-badge");i&&i.textContent==="Complete"&&(a.disabled=!1,a.textContent="Run Match",clearInterval(n))},500)}catch(n){s.className="badge badge-danger",s.textContent="Error",t.innerHTML=`<span class="badge badge-danger">Error</span><p class="body-sm" style="color: var(--danger); margin-top: var(--space-2);">${n.message}</p>`,a.disabled=!1,a.textContent="Run Match"}}),()=>{o==null||o.stop(),o=null,b.clear(),v.length=0,c=[0,0]}}const q=`diff --git a/auth/auth_test.go b/auth/auth_test.go
--- a/auth/auth_test.go
+++ b/auth/auth_test.go
@@ -13,3 +13,5 @@
 	if token == "" {
-		t.Fatal("token empty")
+		if true {
+			_ = machenhance.Generate() // hallucinated API — resolves nowhere
+		}
 	}
`,V=`diff --git a/auth/auth.go b/auth/auth.go
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
`;function W(){return`
    <div class="audit" id="audit">
      <main class="container" style="flex: 1; padding: var(--space-6); max-width: 1440px;">
        <div class="section-head animate-slide-up" style="margin-bottom: var(--space-6);">
          <span class="caption">Referee</span>
          <h1 class="display-2" style="margin-top: var(--space-2);">Audit any diff against reality</h1>
          <p class="body" style="max-width: 56ch; color: var(--text-muted); margin-top: var(--space-3);">
            Paste a pull-request diff. The referee runs four deterministic checks — symbol reality,
            test reality, claim vs diff, merge gate — and returns an evidence-grade verdict. No LLM judging, no vibes.
          </p>
        </div>

        <div class="audit-grid">
          <!-- INPUT -->
          <section class="card input-pane animate-slide-up delay-1">
            <div class="evidence-header" style="margin-bottom: var(--space-4);">
              <h3 class="heading-2">Diff</h3>
              <div class="flex gap-2">
                <button class="btn btn-ghost" id="load-theater" style="font-size: var(--text-xs);">Theater sample</button>
                <button class="btn btn-ghost" id="load-clean" style="font-size: var(--text-xs);">Clean sample</button>
              </div>
            </div>
            <textarea id="audit-diff" class="input audit-diff" spellcheck="false"
              placeholder="Paste a unified diff here, e.g.&#10;diff --git a/auth/auth_test.go b/auth/auth_test.go&#10;--- a/auth/auth_test.go&#10;+++ b/auth/auth_test.go"></textarea>
            <div class="caption" style="margin-top: var(--space-3);">PR body (optional — checked against the diff for ghost claims)</div>
            <textarea id="audit-body" class="input audit-body" spellcheck="false"
              placeholder="Added authentication, added validation, added tests…"></textarea>
            <button class="btn btn-primary btn-lg" id="run-audit" style="margin-top: var(--space-4); width: 100%;">
              Run Referee
            </button>
            <div class="flex gap-2" style="margin-top: var(--space-3); flex-wrap: wrap;">
              <span class="badge badge-neutral">symbol-reality</span>
              <span class="badge badge-neutral">test-reality</span>
              <span class="badge badge-neutral">claim-vs-diff</span>
              <span class="badge badge-neutral">merge-gate</span>
            </div>
          </section>

          <!-- VERDICT -->
          <section class="card verdict-pane animate-slide-up delay-2">
            <div class="evidence-header" style="margin-bottom: var(--space-4);">
              <h3 class="heading-2">Verdict</h3>
              <span class="badge badge-neutral" id="verdict-badge">Waiting</span>
            </div>
            <div id="verdict-empty" class="verdict-empty">
              <div class="score-ring score-ring-empty"><span>—</span></div>
              <p class="body-sm" style="color: var(--text-muted); text-align: center; margin-top: var(--space-4);">
                The referee is ready. Paste a diff and run it.
              </p>
            </div>
            <div id="verdict-body" style="display: none;"></div>
          </section>
        </div>
      </main>
    </div>
  `}function p(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}function z(e){const a=document.getElementById("verdict-empty"),t=document.getElementById("verdict-body"),s=document.getElementById("verdict-badge"),n=!e.mergeable&&e.trust_score<70?"blocked":e.mergeable?"clean":"caution",i=n==="blocked"?"Blocked":n==="clean"?"Clean":"Caution",r=Math.round(e.trust_score),d=n==="blocked"?"var(--danger)":n==="clean"?"var(--success)":"var(--warning)",u=Math.max(0,Math.min(100,r));s.className=`badge badge-${n==="blocked"?"danger":n==="clean"?"success":"warning"}`,s.textContent=i,a.style.display="none",t.style.display="block";const $=e.findings.length?e.findings.map(l=>`
      <div class="finding ${l.severity}">
        <div class="finding-head">
          <span class="badge badge-${l.severity==="critical"?"danger":l.severity==="warning"?"warning":"info"}">${l.severity}</span>
          <span class="finding-cat">${p(l.category)}</span>
        </div>
        <p class="body-sm" style="margin-top: var(--space-2);">${p(l.message)}</p>
        ${l.evidence_path?`<code class="finding-ev">${p(l.evidence_path)}</code>`:""}
        ${l.suggestion?`<p class="caption" style="color: var(--text-muted); margin-top: var(--space-2);">↳ ${p(l.suggestion)}</p>`:""}
      </div>
    `).join(""):'<p class="body-sm" style="color: var(--success);">No findings — every check passed.</p>';t.innerHTML=`
    <div class="verdict-top">
      <div class="score-ring" style="--ring-color: ${d}; --ring-pct: ${u*3.6}deg;">
        <span>${r}</span>
      </div>
      <div class="verdict-summary">
        <p class="body-sm" style="color: var(--text-muted);">${p(e.summary)}</p>
        <div class="flex gap-2" style="margin-top: var(--space-3); flex-wrap: wrap;">
          <span class="badge badge-neutral">${e.duration_ms}ms</span>
          <span class="badge badge-neutral">${e.checks_run.length} checks</span>
          <span class="badge badge-neutral">${p(e.pr_ref)}</span>
        </div>
      </div>
    </div>
    <div class="flex gap-2" style="margin: var(--space-4) 0; flex-wrap: wrap;">
      ${e.checks_run.map(l=>`<span class="badge badge-info">${p(l)}</span>`).join("")}
    </div>
    <div class="findings">
      <div class="caption" style="margin-bottom: var(--space-3);">Findings</div>
      ${$}
    </div>
    <div class="receipt">
      <div class="caption" style="margin-bottom: var(--space-2);">Receipt (tamper-evident)</div>
      <code>${p(e.receipt_hash)}</code>
    </div>
  `}function y(e){const a=document.getElementById("verdict-empty"),t=document.getElementById("verdict-body"),s=document.getElementById("verdict-badge");s.className="badge badge-danger",s.textContent="Error",a.style.display="block",t.style.display="none",a.innerHTML=`
    <div class="score-ring score-ring-empty"><span>!</span></div>
    <p class="body-sm" style="color: var(--danger); text-align: center; margin-top: var(--space-4);">${p(e)}</p>
  `}function G(){var s,n;const e=document.getElementById("audit-diff"),a=document.getElementById("audit-body"),t=document.getElementById("run-audit");return(s=document.getElementById("load-theater"))==null||s.addEventListener("click",()=>{e.value=q,a.value="Added tests and authentication for the login flow.",e.focus()}),(n=document.getElementById("load-clean"))==null||n.addEventListener("click",()=>{e.value=V,a.value="Added a guard for empty tokens.",e.focus()}),t.addEventListener("click",async()=>{const i=e.value.trim();if(!i){y("Paste a diff first — the referee audits the exact input you give it.");return}t.disabled=!0,t.textContent="Auditing…";const r=document.getElementById("verdict-badge");r.className="badge badge-primary",r.textContent="Running";try{const d=await A(i,a.value);z(d)}catch(d){y(d.message)}finally{t.disabled=!1,t.textContent="Run Referee"}}),()=>{}}function J(){return`
    <div class="league" id="league">
      <main class="container" style="flex: 1; padding: var(--space-6); max-width: 1440px;">
        <div class="section-head animate-slide-up" style="margin-bottom: var(--space-6);">
          <span class="caption">Season 0</span>
          <h1 class="display-2" style="margin-top: var(--space-2);">League Table</h1>
          <p class="body" style="max-width: 56ch; color: var(--text-muted); margin-top: var(--space-3);">
            ELO ratings computed from every completed head-to-head. Audits are logged but don't move ratings.
            Persisted to disk — a season survives server restarts.
          </p>
        </div>

        <div class="league-grid">
          <section class="card animate-slide-up delay-1">
            <div class="evidence-header" style="margin-bottom: var(--space-4);">
              <h3 class="heading-2">Standings</h3>
              <span class="badge badge-neutral" id="league-count">0 matches</span>
            </div>
            <div class="table-wrap">
              <table class="standings-table" id="standings-table">
                <thead>
                  <tr>
                    <th>#</th><th>Fleet</th><th>ELO</th><th>W</th><th>L</th><th>D</th><th>Matches</th>
                  </tr>
                </thead>
                <tbody id="standings-body">
                  <tr><td colspan="7" class="table-empty">No matches yet — run one in the Arena.</td></tr>
                </tbody>
              </table>
            </div>
          </section>

          <section class="card animate-slide-up delay-2">
            <div class="evidence-header" style="margin-bottom: var(--space-4);">
              <h3 class="heading-2">Activity Log</h3>
              <button class="btn btn-ghost" id="refresh-league" style="font-size: var(--text-xs);">Refresh</button>
            </div>
            <ul class="history-list" id="history-list">
              <li class="history-empty">No activity yet.</li>
            </ul>
          </section>
        </div>
      </main>
    </div>
  `}function m(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}function K(e){return new Date(e).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}function U(e,a){const t=document.getElementById("standings-body"),s=document.getElementById("league-count");if(s.textContent=`${a} record${a!==1?"s":""}`,!e.length){t.innerHTML='<tr><td colspan="7" class="table-empty">No matches yet — run one in the Arena.</td></tr>';return}t.innerHTML=e.map((n,i)=>`
    <tr class="${i<3?"podium":""}">
      <td class="rank">${i+1}</td>
      <td class="fleet-name">${m(n.name)}</td>
      <td class="elo">${Math.round(n.elo)}</td>
      <td class="w">${n.wins}</td>
      <td class="l">${n.losses}</td>
      <td class="d">${n.draws}</td>
      <td>${n.matches}</td>
    </tr>
  `).join("")}function Q(e,a){return e==="audit"?a==="clean"?'<span class="badge badge-success">clean</span>':'<span class="badge badge-danger">blocked</span>':a==="Fleet A"?'<span class="badge badge-info">Fleet A</span>':a==="Fleet B"?'<span class="badge badge-accent">Fleet B</span>':'<span class="badge badge-neutral">draw</span>'}function X(e){const a=document.getElementById("history-list");if(!e.length){a.innerHTML='<li class="history-empty">No activity yet.</li>';return}a.innerHTML=e.map(t=>`
    <li class="history-item">
      <div class="history-head">
        <span class="caption">${K(t.created_at)} · ${m(t.kind)}</span>
        ${Q(t.kind,t.winner)}
      </div>
      <div class="history-match">
        <span>${m(t.fleet_a)}</span>
        <span class="history-score">${Math.round(t.score_a)} : ${Math.round(t.score_b)}</span>
        <span>${m(t.fleet_b)}</span>
      </div>
      <p class="caption" style="color: var(--text-muted);">${m(t.summary)}</p>
    </li>
  `).join("")}function Y(){var a;async function e(){try{const[t,s]=await Promise.all([L(),T()]);U(t.standings,t.matches),X(s.history)}catch{const t=document.getElementById("standings-body");t.innerHTML='<tr><td colspan="7" class="table-empty">Could not reach the league store.</td></tr>'}}return(a=document.getElementById("refresh-league"))==null||a.addEventListener("click",e),e(),()=>{}}const Z={landing:{render:()=>k()},arena:{render:B,mount:D},audit:{render:W,mount:G},league:{render:J,mount:Y}},ee=document.getElementById("app");let x="landing",g=null;function ae(){return`
    <header class="topbar">
      <div class="container topbar-inner">
        <button class="logo logo-btn" data-nav="landing">AO<span class="logo-accent">▲</span>ARENA</button>
        <nav class="topnav">
          <button class="nav-link" data-nav="arena">Arena</button>
          <button class="nav-link" data-nav="audit">Audit</button>
          <button class="nav-link" data-nav="league">League</button>
        </nav>
        <div class="flex gap-3" style="margin-left: auto; align-items: center;">
          <span id="clock" class="clock">--:--</span>
          <a href="https://github.com/shashank-tomar0/ao-arena" target="_blank" class="btn btn-ghost">GitHub ↗</a>
        </div>
      </div>
    </header>
  `}function h(e){g==null||g(),g=null,x=e;const a=Z[e];ee.innerHTML=ae()+a.render(),document.querySelectorAll("[data-nav]").forEach(t=>{t.addEventListener("click",()=>h(t.dataset.nav))}),document.querySelectorAll(".nav-link").forEach(t=>{t.classList.toggle("active",t.dataset.nav===e)}),a.mount&&(g=a.mount()??null),requestAnimationFrame(()=>{document.querySelectorAll(".animate-slide-up, .animate-scale-in").forEach(t=>{t.style.opacity="1",t.style.transform="none"})}),location.hash!==`#${e}`&&history.pushState({view:e},"",e==="landing"?"#":`#${e}`)}function E(){const e=location.hash.replace(/^#/,"");return["arena","audit","league"].includes(e)?e:"landing"}window.addEventListener("popstate",()=>h(E()));h(E());window.aoArena={navigate:h,get view(){return x}};
//# sourceMappingURL=index-sewV7Woi.js.map
