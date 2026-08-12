(function(){const a=document.createElement("link").relList;if(a&&a.supports&&a.supports("modulepreload"))return;for(const t of document.querySelectorAll('link[rel="modulepreload"]'))s(t);new MutationObserver(t=>{for(const i of t)if(i.type==="childList")for(const c of i.addedNodes)c.tagName==="LINK"&&c.rel==="modulepreload"&&s(c)}).observe(document,{childList:!0,subtree:!0});function n(t){const i={};return t.integrity&&(i.integrity=t.integrity),t.referrerPolicy&&(i.referrerPolicy=t.referrerPolicy),t.crossOrigin==="use-credentials"?i.credentials="include":t.crossOrigin==="anonymous"?i.credentials="omit":i.credentials="same-origin",i}function s(t){if(t.ep)return;t.ep=!0;const i=n(t);fetch(t.href,i)}})();function b(){const e={session:[],referee:[],score:[],clock:[],status:[]};let a=null;const n=Date.now();return{onSession(s){e.session.push(s)},onReferee(s){e.referee.push(s)},onScore(s){e.score.push(s)},onClock(s){e.clock.push(s)},onStatus(s){e.status.push(s)},start(){a=new EventSource("/events"),a.onmessage=t=>{let i;try{i=JSON.parse(t.data)}catch{return}switch(i.kind){case"session":e.session.forEach(c=>c(i.data));break;case"referee":e.referee.forEach(c=>c(i.data));break;case"score":{const[c,r]=i.data;e.score.forEach(p=>p(c,r))}break}};const s=window.setInterval(()=>{e.clock.forEach(t=>t(Date.now()-n))},250);a.addEventListener("close",()=>window.clearInterval(s))},stop(){a==null||a.close()},async runMatch(){const s=await fetch("/api/match",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({fleet_a_diff:"",fleet_b_diff:""})});if(!s.ok)throw new Error("failed to start match: "+s.status);const t=await s.json();e.status.forEach(i=>i(t))}}}function y(){return b()}const w={pending:"Pending",working:"Iterating",needs_input:"Needs input",ci_failed:"CI failed",changes_requested:"Changes requested",review_pending:"In review",mergeable:"Mergeable",merged:"Merged"};let v="landing";const h=document.getElementById("app"),d=y();function k(){return`
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
              <button class="btn btn-primary" id="enter-arena">Enter the Arena</button>
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
              <div class="mini-score" style="color: var(--fleet-a)">30</div>
              <div class="mini-divider">/</div>
              <div class="mini-score" style="color: var(--fleet-b)">100</div>
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
            ${[{icon:"🔍",title:"Symbol Reality",desc:"Catches hallucinated imports and API calls that resolve to nothing. Every reference verified against the actual codebase symbol graph.",tag:"Critical"},{icon:"🎭",title:"Test Reality",desc:"Mutation-differential proof: if tests pass after assertions are neutralized, the suite is theater. Catches expect(true).toBe(true) and empty test bodies.",tag:"Critical"},{icon:"👻",title:"Claim vs Diff",desc:"Agent PR summaries often describe work the diff doesn't contain. Ghost claims flagged with file:line evidence.",tag:"Critical"},{icon:"🚪",title:"Merge Gate",desc:"CI status, conflicts, coverage sanity. An agent PR must be merge-ready, not just green.",tag:"Warning"}].map((e,a)=>`
              <article class="card feature-card animate-slide-up" style="animation-delay: ${a*80}ms;">
                <div class="feature-icon">${e.icon}</div>
                <h3 class="heading-2" style="margin: var(--space-3) 0 var(--space-2);">${e.title}</h3>
                <p class="body-sm" style="color: var(--text-muted);">${e.desc}</p>
                <span class="badge badge-${e.tag.toLowerCase()}" style="margin-top: var(--space-3); display: inline-block;">${e.tag}</span>
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
            ${[{id:"rest-api-auth",name:"REST API with Auth",desc:"JWT register/login/me endpoints. Acceptance: 4 behaviors, 100% coverage target.",checks:["Symbol Reality","Test Reality","Claim vs Diff"]},{id:"realtime-chat",name:"Real-time Chat",desc:"WebSocket server with presence. Bidirectional messaging, graceful shutdown, 100ms echo.",checks:["Symbol Reality","Test Reality","Claim vs Diff"]},{id:"cli-task-tracker",name:"CLI Task Tracker",desc:"Persistent add/list/done/rm with file storage. Error paths tested, no panics.",checks:["Symbol Reality","Test Reality","Claim vs Diff"]}].map((e,a)=>`
              <article class="card spec-card animate-slide-up" style="animation-delay: ${a*80}ms;">
                <div class="spec-header">
                  <span class="caption" style="color: var(--primary);">${e.id}</span>
                  <span class="badge badge-neutral">${e.checks.length} checks</span>
                </div>
                <h3 class="heading-2" style="margin: var(--space-3) 0 var(--space-2);">${e.name}</h3>
                <p class="body-sm" style="color: var(--text-muted); margin-bottom: var(--space-4);">${e.desc}</p>
                <div class="flex gap-2 flex-wrap">
                  ${e.checks.map(n=>`<span class="badge badge-info">${n}</span>`).join("")}
                </div>
              </article>
            `).join("")}
          </div>
        </div>
      </section>

      <!-- HOW IT WORKS -->
      <section class="section how-it-works">
        <div class="container">
          <div class="section-head animate-slide-up" style="text-align: center;">
            <span class="caption">The Flow</span>
            <h2 class="display-2" style="margin-top: var(--space-2);">From agent code to trust score in seconds</h2>
          </div>
          <div class="flow" style="display: flex; gap: var(--space-4); margin-top: var(--space-8); flex-wrap: wrap; justify-content: center;">
            ${[{step:"1",label:"Agent delivers",desc:"Code pushed to isolated worktree"},{step:"2",label:"Tests run",desc:"go test -cover in real environment"},{step:"3",label:"Referee audits",desc:"4 deterministic checks execute"},{step:"4",label:"Score computed",desc:"0–100 trust score, merge gate"},{step:"5",label:"Broadcast",desc:"Live Kanban + evidence rail"}].map((e,a)=>`
              <div class="flow-step card animate-slide-up" style="animation-delay: ${a*80}ms; min-width: 180px; max-width: 220px; text-align: center;">
                <div class="flow-step-num" style="font-size: var(--text-3xl); font-weight: 700; color: var(--primary); font-family: var(--font-display);">${e.step}</div>
                <h4 class="heading-2" style="margin: var(--space-2) 0;">${e.label}</h4>
                <p class="caption" style="color: var(--text-muted);">${e.desc}</p>
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
          <button class="btn btn-primary btn-lg" id="enter-arena-footer" style="padding: var(--space-3) var(--space-8); font-size: var(--text-base);">
            Enter the Arena →
          </button>
        </div>
      </footer>
    </div>
  `}function E(){return`
    <div class="arena" id="arena">
      <header id="topbar" class="topbar">
        <div class="container flex" style="height: 100%; gap: var(--space-4);">
          <span class="logo">AO<span class="logo-accent">▲</span>ARENA</span>
          <span id="match-title" class="match-title">Season 0 · Round 1</span>
          <div class="flex gap-2" style="margin-left: auto;">
            <button class="btn btn-ghost" id="back-to-landing">← Landing</button>
            <span id="clock" class="clock">--:--</span>
            <button class="btn btn-accent" id="run-match">Run Match</button>
          </div>
        </div>
      </header>

      <main class="container" style="flex: 1; padding: var(--space-4); max-width: 1600px;">
        <section id="boards" class="boards">
          <div class="board" id="board-a" data-fleet="a">
            <div class="board-header">
              <h2 class="board-title">Fleet A</h2>
              <div class="score-pill" id="score-a-pill">0</div>
            </div>
            <div class="kanban" id="kanban-a"></div>
          </div>

          <div class="vs-divider">VS</div>

          <div class="board" id="board-b" data-fleet="b">
            <div class="board-header">
              <h2 class="board-title">Fleet B</h2>
              <div class="score-pill" id="score-b-pill">0</div>
            </div>
            <div class="kanban" id="kanban-b"></div>
          </div>
        </section>

        <aside class="sidebar">
          <section id="evidence" class="card">
            <div class="evidence-header">
              <h3>Referee Evidence</h3>
              <span class="badge badge-neutral" id="evidence-count">0 findings</span>
            </div>
            <ul id="evidence-list" class="evidence-list"></ul>
          </section>

          <section id="spec-info" class="card" style="margin-top: var(--space-4);">
            <h3>Active Spec</h3>
            <div id="spec-detail" class="spec-detail">
              <div class="spec-row"><span class="caption">ID</span><span id="spec-id">rest-api-auth</span></div>
              <div class="spec-row"><span class="caption">Description</span><span id="spec-desc">REST API with authentication</span></div>
              <div class="spec-row"><span class="caption">Checks</span><span id="spec-checks">Symbol Reality, Test Reality, Claim vs Diff, Merge Gate</span></div>
            </div>
          </section>

          <section id="match-status" class="card" style="margin-top: var(--space-4);">
            <h3>Match Status</h3>
            <div id="status-display" class="status-display">
              <span class="badge badge-neutral">Idle</span>
              <p class="body-sm" style="color: var(--text-muted); margin-top: var(--space-2);">Click "Run Match" to start a head-to-head</p>
            </div>
          </section>
        </aside>
      </main>
    </div>
  `}function $(){const e=["pending","working","needs_input","ci_failed","changes_requested","review_pending","mergeable","merged"];["a","b"].forEach(a=>{const n=document.getElementById(`kanban-${a}`);e.forEach(s=>{const t=document.createElement("div");t.className="kanban",t.dataset.lane=s,t.innerHTML=`<h3>${w[s]}</h3><div class="cards"></div>`,n.appendChild(t)})})}const m=new Map,o=[];let l=[0,0];function x(e){const a=document.querySelectorAll(`#board-${e} .kanban`),n=[...m.values()].filter(s=>s.fleet===e);a.forEach(s=>{const t=s.dataset.lane,i=s.querySelector(".cards");if(!i)return;const c=n.filter(r=>r.status===t).sort((r,p)=>r.ts-p.ts);i.innerHTML=c.map(r=>`
      <div class="card ${r.status==="ci_failed"?"alert":""} animate-scale-in" title="${r.id}" style="animation-delay: ${Math.random()*50}ms;">
        <span class="card-label">${r.label}</span>
        <span class="card-branch">${r.branch}</span>
        ${r.pr?`<span class="card-pr">${r.pr}</span>`:""}
      </div>
    `).join("")})}function S(){const e=document.getElementById("evidence-list"),a=document.getElementById("evidence-count"),n=[...o].slice(-8).reverse();e.innerHTML=n.map(s=>`
    <li class="ev ${s.severity} animate-slide-up">
      <strong>${s.category}</strong>
      <span>${s.message}</span>
      ${s.evidence?`<code>${s.evidence}</code>`:""}
    </li>
  `).join(""),a.textContent=`${o.length} finding${o.length!==1?"s":""}`}function f(){const e=document.getElementById("score-a-pill"),a=document.getElementById("score-b-pill");e.textContent=`${l[0]}`,a.textContent=`${l[1]}`,e.style.color=l[0]>=70?"var(--success)":l[0]>0?"var(--warning)":"var(--danger)",a.style.color=l[1]>=70?"var(--success)":l[1]>0?"var(--warning)":"var(--danger)"}function C(e){const a=document.getElementById("clock"),n=Math.floor(e/1e3),s=String(Math.floor(n/60)).padStart(2,"0"),t=String(n%60).padStart(2,"0");a.textContent=`${s}:${t}`}function A(e){const a=document.getElementById("status-display");if(!e||e.status==="idle"){a.innerHTML='<span class="badge badge-neutral">Idle</span><p class="body-sm" style="color: var(--text-muted); margin-top: var(--space-2);">Click "Run Match" to start a head-to-head</p>';return}if(e.status==="complete"){const n=e.winner==="a"?"var(--fleet-a)":e.winner==="b"?"var(--fleet-b)":"var(--accent)";a.innerHTML=`
      <span class="badge badge-success" style="background: ${n}22; color: ${n};">Complete — ${e.winner==="draw"?"Draw":`Winner: Fleet ${e.winner.toUpperCase()}`}</span>
      <p class="body-sm" style="color: var(--text-muted); margin-top: var(--space-2);">Duration: ${Math.round(e.duration/1e3)}s | Spec: ${e.spec_id}</p>
      <div class="flex gap-2" style="margin-top: var(--space-3); flex-wrap: wrap;">
        <span class="badge badge-info">Fleet A: ${e.fleet_a.trust_score}/100</span>
        <span class="badge badge-info">Fleet B: ${e.fleet_b.trust_score}/100</span>
      </div>
    `;return}a.innerHTML='<span class="badge badge-primary">Running...</span><p class="body-sm" style="color: var(--text-muted); margin-top: var(--space-2);">Fleets are working...</p>'}d.onSession(e=>{m.set(e.id,e),x(e.fleet)});d.onReferee(e=>{if(o.push(e),S(),e.severity==="critical"){const a=e.fleet==="a"?0:1;l[a]=Math.max(0,l[a]-30),f()}});d.onScore((e,a)=>{l=[e,a],f()});d.onClock(e=>C(e));d.onStatus(e=>A(e));function g(){var e,a;v="landing",h.innerHTML=k(),(e=document.getElementById("enter-arena"))==null||e.addEventListener("click",u),(a=document.getElementById("enter-arena-footer"))==null||a.addEventListener("click",u),requestAnimationFrame(()=>{document.querySelectorAll(".animate-slide-up, .animate-scale-in").forEach(n=>{n.style.opacity="1",n.style.transform="none"})})}function u(){var e,a;v="arena",h.innerHTML=E(),$(),d.start(),(e=document.getElementById("back-to-landing"))==null||e.addEventListener("click",g),(a=document.getElementById("run-match"))==null||a.addEventListener("click",()=>{const n=document.getElementById("status-display");n.innerHTML='<span class="badge badge-primary">Starting...</span>',d.runMatch().catch(s=>{n.innerHTML=`<span class="badge badge-danger">Error</span><p class="body-sm" style="color: var(--danger); margin-top: var(--space-2);">${s.message}</p>`})})}g();window.addEventListener("popstate",()=>{v==="arena"&&g()});window.aoArena={feed:d,cards:m,evidence:o,currentScore:l};
//# sourceMappingURL=index-hhdQ7nHa.js.map
