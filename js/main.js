const loader=document.getElementById("loader");
if(loader){
  window.addEventListener("load",()=>{
    setTimeout(()=>{
      loader.style.opacity = "0";
      loader.style.visibility = "hidden";
    }, 850);

    setTimeout(()=>loader.remove(), 1400);
  });
}

const header=document.getElementById("header");
let lastScrollY=0;
if(header&&!document.body.classList.contains("stream-catalog")){
  window.addEventListener("scroll",()=>{
    const currentY=window.scrollY;
    if(Math.abs(currentY-lastScrollY) < 8) return;
    lastScrollY=currentY;
    header.classList.toggle("scrolled",currentY>30);
  },{passive:true});
}

const toggle=document.getElementById("menuToggle");
const nav=document.getElementById("nav");
if(toggle&&nav){
  toggle.addEventListener("click",()=>nav.classList.toggle("open"));
  nav.querySelectorAll("a").forEach(a=>a.addEventListener("click",()=>nav.classList.remove("open")));
}

const observer=new IntersectionObserver(entries=>{
  entries.forEach(entry=>{
    if(entry.isIntersecting){
      entry.target.classList.add("visible");
      observer.unobserve(entry.target);
    }
  });
},{rootMargin:"0px 0px 18% 0px",threshold:0.04});

const streamGrid = document.querySelector(".stream-grid");
const columns = streamGrid ? Math.max(getComputedStyle(streamGrid).gridTemplateColumns.split(/\s+/).filter(Boolean).length, 1) : 5;

document.querySelectorAll(".reveal").forEach((el,index)=>{
  const isStreamCard = el.classList.contains("stream-card");

  if(isStreamCard&&document.body.classList.contains("stream-catalog")){
    el.classList.add("visible");
    return;
  }

  if(isStreamCard){
    const row = Math.floor(index / columns);
    const column = index % columns;
    const cardDelay = row * 20 + column * 10;
    el.style.transitionDelay = `${cardDelay}ms`;
    el.style.setProperty("--reveal-x", `${-6 - column * 2}px`);
  } else {
    const cardDelay = Math.min(index % 4, 3) * 18;
    el.style.transitionDelay = `${cardDelay}ms`;
  }

  observer.observe(el);
});

const year=document.getElementById("year");
if(year)year.textContent=new Date().getFullYear();

const prefersReducedMotion=window.matchMedia("(prefers-reduced-motion: reduce)");
const footerCopies=[...document.querySelectorAll(".footer-copy")];
let snowCanvas=null;
let snowContext=null;
let snowParticles=[];
let snowFrame=0;
let snowRemovalTimer=0;
let halloweenActivationFrame=0;
let snowActive=false;
let lastSnowFrame=0;
let halloweenMode=false;
let spookyOverlay=null;

const createSnowflake=(startAtTop=false)=>({
  x:Math.random()*window.innerWidth,
  y:startAtTop?-Math.random()*window.innerHeight:Math.random()*window.innerHeight,
  radius:.8+Math.random()*2.2,
  speed:28+Math.random()*62,
  wind:-8+Math.random()*16,
  swing:8+Math.random()*22,
  phase:Math.random()*Math.PI*2,
  opacity:.35+Math.random()*.55
});

const resizeSnowCanvas=()=>{
  if(!snowCanvas||!snowContext)return;
  const ratio=Math.min(window.devicePixelRatio||1,1);
  snowCanvas.width=Math.round(window.innerWidth*ratio);
  snowCanvas.height=Math.round(window.innerHeight*ratio);
  snowCanvas.style.width=`${window.innerWidth}px`;
  snowCanvas.style.height=`${window.innerHeight}px`;
  snowContext.setTransform(ratio,0,0,ratio,0,0);
  const particleCount=Math.min(120,Math.max(45,Math.round(window.innerWidth*window.innerHeight/12000)));
  snowParticles=Array.from({length:particleCount},()=>createSnowflake());
};

const drawSnow=(time)=>{
  if(!snowActive||!snowCanvas||!snowContext)return;
  const delta=lastSnowFrame?Math.min((time-lastSnowFrame)/1000,.04):0;
  lastSnowFrame=time;
  snowContext.clearRect(0,0,window.innerWidth,window.innerHeight);
  snowParticles.forEach(flake=>{
    flake.y+=flake.speed*delta;
    flake.x+=(flake.wind+Math.sin(time*.0008+flake.phase)*flake.swing)*delta;
    if(flake.y>window.innerHeight+flake.radius){flake.y=-flake.radius;flake.x=Math.random()*window.innerWidth;}
    if(flake.x<-8)flake.x=window.innerWidth+8;
    if(flake.x>window.innerWidth+8)flake.x=-8;
    snowContext.save();
    snowContext.translate(flake.x,flake.y);
    snowContext.rotate(time*.00018+flake.phase);
    snowContext.globalAlpha=flake.opacity;
    snowContext.fillStyle="#eef4ff";
    snowContext.shadowColor="rgba(166, 193, 255, .62)";
    snowContext.shadowBlur=flake.radius>2?5:1;
    snowContext.beginPath();
    snowContext.arc(0,0,flake.radius,0,Math.PI*2);
    snowContext.fill();
    if(flake.radius>2.2){
      snowContext.strokeStyle=`rgba(224, 234, 255, ${flake.opacity*.62})`;
      snowContext.lineWidth=.65;
      snowContext.beginPath();
      for(let arm=0;arm<3;arm++){
        const angle=arm*Math.PI/3;
        snowContext.moveTo(Math.cos(angle)*-flake.radius*2,Math.sin(angle)*-flake.radius*2);
        snowContext.lineTo(Math.cos(angle)*flake.radius*2,Math.sin(angle)*flake.radius*2);
      }
      snowContext.stroke();
    }
    snowContext.restore();
  });
  snowFrame=requestAnimationFrame(drawSnow);
};

const startSnow=()=>{
  if(prefersReducedMotion.matches)return;
  window.clearTimeout(snowRemovalTimer);
  halloweenMode=new Date().getMonth()===9;

  if(halloweenMode){
    if(!spookyOverlay){
      spookyOverlay=document.createElement("div");
      spookyOverlay.className="footer-spooky-overlay";
      spookyOverlay.setAttribute("aria-hidden","true");
      const spookyTitle=document.createElement("div");
      spookyTitle.className="footer-spooky-title";
      const spookyGreeting=document.createElement("span");
      spookyGreeting.className="footer-spooky-heading";
      spookyGreeting.textContent="FELIZ";
      const spookyHeading=document.createElement("span");
      spookyHeading.className="footer-spooky-heading";
      spookyHeading.textContent="HALLOWEEN";
      spookyTitle.appendChild(spookyGreeting);
      spookyTitle.appendChild(spookyHeading);
      spookyOverlay.appendChild(spookyTitle);
      const particlesPerEmoji=window.matchMedia("(max-width: 768px)").matches?2:3;
      ["🎃","👻","💀"].forEach(emoji=>{
        for(let i=0;i<particlesPerEmoji;i++){
          const particle=document.createElement("span");
          particle.className="footer-spooky-particle";
          particle.textContent=emoji;
          particle.style.setProperty("--x", `${Math.round((Math.random()-.5)*80)}vw`);
          particle.style.setProperty("--fall-duration", `${8+Math.random()*5}s`);
          particle.style.setProperty("--fall-delay", `${Math.random()*2.4}s`);
          particle.style.setProperty("--fall-sway", `${Math.round((Math.random()-.5)*96)}px`);
          particle.style.setProperty("--fall-spin", `${Math.round((Math.random()-.5)*120)}deg`);
          spookyOverlay.appendChild(particle);
        }
      });
    }
    if(!spookyOverlay.isConnected)document.body.appendChild(spookyOverlay);
    snowActive=true;
    footerCopies.forEach(footerCopy=>footerCopy.classList.add("is-halloween","is-active"));
    halloweenActivationFrame=window.requestAnimationFrame(()=>{
      halloweenActivationFrame=window.requestAnimationFrame(()=>{
        if(snowActive&&halloweenMode)spookyOverlay?.classList.add("is-active");
        halloweenActivationFrame=0;
      });
    });
    return;
  }

  if(!snowCanvas){
    snowCanvas=document.createElement("canvas");
    snowCanvas.className="footer-snow-canvas";
    snowCanvas.setAttribute("aria-hidden","true");
    snowContext=snowCanvas.getContext("2d",{alpha:true});
    if(!snowContext){snowCanvas=null;return;}
    document.body.appendChild(snowCanvas);
  } else if(!snowCanvas.isConnected){
    document.body.appendChild(snowCanvas);
  }

  resizeSnowCanvas();
  if(snowActive)return;
  footerCopies.forEach(footerCopy=>footerCopy.classList.add("is-active"));
  snowActive=true;
  snowCanvas.classList.add("is-active");
  lastSnowFrame=0;
  snowFrame=requestAnimationFrame(drawSnow);
};

const stopSnow=()=>{
  if(!snowActive)return;
  snowActive=false;
  window.cancelAnimationFrame(halloweenActivationFrame);
  halloweenActivationFrame=0;
  window.cancelAnimationFrame(snowFrame);
  snowCanvas?.classList.remove("is-active");
  spookyOverlay?.classList.remove("is-active");
  footerCopies.forEach(footerCopy=>footerCopy.classList.remove("is-halloween","is-active"));
  snowRemovalTimer=window.setTimeout(()=>{
    snowCanvas?.remove();
    spookyOverlay?.remove();
    snowCanvas=null;
    snowContext=null;
    spookyOverlay=null;
    snowParticles=[];
    halloweenMode=false;
  }, halloweenMode ? 1200 : 320);
};

window.addEventListener("resize",()=>{ if(snowActive&&!halloweenMode)resizeSnowCanvas(); },{passive:true});
prefersReducedMotion.addEventListener?.("change",event=>{ if(event.matches)stopSnow(); });

footerCopies.forEach(footerCopy=>{
  footerCopy.addEventListener("click",()=>{ if(snowActive) stopSnow(); else startSnow(); });
  footerCopy.addEventListener("keydown",event=>{
    if(event.key === "Enter" || event.key === " "){
      event.preventDefault();
      if(snowActive) stopSnow(); else startSnow();
    }
  });
});

document.addEventListener("click",event=>{
  if(!snowActive)return;
  if(halloweenMode){
    event.preventDefault();
    event.stopImmediatePropagation();
    stopSnow();
    return;
  }
  if(!event.target.closest(".footer-copy")) stopSnow();
},true);
