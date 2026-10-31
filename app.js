'use strict';
const C=window.STUDY_CONFIG, app=document.getElementById('app'), progress=document.getElementById('progress');
const QUESTIONS=[
 ['판매자가 해당 상품을 구매한 시기는 언제인가요?',['2024년 5월','2025년 9월','2024년 11월','2025년 2월'],1],
 ['판매자가 밝힌 상품의 사용 기간은 얼마인가요?',['약 3개월','약 6개월','약 1년','약 2년'],2],
 ['서술 및 사진을 통해 확인되지 않은 하자는 무엇인가요?',['소매의 얼룩','주머니 부분 실밥','로고 부분 올 뜯김','지퍼 코팅 벗겨짐'],1],
 ['택배 거래 시 추가금은 얼마인가요?',['1,500원','2,000원','3,000원','택배 거래 불가(직거래만 가능)'],2],
 ['판매자가 제시한 상품 가격은 얼마인가요?',['30,000원','50,000원','80,000원','100,000원'],0]
];
const ITEMS=[
 ['원인의 소재 (Locus of Causality)',[
 '이 문제의 원인은 주로 상품 정보를 올린 판매자에게 있다고 생각한다.',
 '이 분쟁 상황에서 판매자 개인의 잘못이 크다고 생각한다.'
 ]],
 ['통제 가능성 (Controllability)',[
 '판매자가 상품의 상태를 더 정확하게 확인했다면 이러한 문제를 예방할 수 있었을 것이라고 생각한다.',
 '판매자는 상품의 실제 상태를 구매자에게 더 정확하게 알릴 수 있었다고 생각한다.'
 ]],
 ['안정성 (Stability)',[
 '이 판매자는 앞으로 다른 거래에서도 상품의 상태를 정확하게 설명하지 않을 가능성이 있다고 생각한다.',
 '이 판매자와 다시 거래하더라도 비슷한 문제가 발생할 가능성이 있다고 생각한다.'
 ]],
 ['종합적 책임 판단',[
 '이번 문제에 대해 판매자가 책임을 져야 한다고 생각한다.',
 '구매자인 나는 이번 문제에 대해 판매자에게 해결이나 보상을 요구할 수 있다고 생각한다.'
 ]]
];
let participant=null,startTime=0,busy=false;
function configured(){return C&&/^https:\/\/.+\.supabase\.co$/.test(C.url)&&C.anonKey&&!C.anonKey.startsWith('PASTE_')}
async function rpc(fn,data={}){const r=await fetch(C.url+'/rest/v1/rpc/'+fn,{method:'POST',headers:{apikey:C.anonKey,'Content-Type':'application/json'},body:JSON.stringify(data),cache:'no-store'});const raw=await r.text();if(!r.ok)throw Error('요청 실패 ('+r.status+'): '+raw.slice(0,180));return raw?JSON.parse(raw):null}
function setStage(s){progress.textContent=['연구 참여 안내','01 / 거래글 열람','02 / 정보 재인 검사','03 / 책임 판단','응답 완료'][s]}
function html(content){app.innerHTML='<section class="panel">'+content+'</section>';window.scrollTo(0,0)}
function lock(){history.pushState({study:true},'',location.pathname)}
addEventListener('popstate',()=>{lock();if(participant)render(participant.stage)});
function error(e){alert(e.message||'연결 오류가 발생했습니다. 다시 시도해 주세요.')}
async function advance(stage,payload){if(busy)return;busy=true;const btn=app.querySelector('button[type=submit]');if(btn)btn.disabled=true;try{const v=await rpc('study_advance',{p_token:participant.token,p_expected_stage:stage,p_payload:payload});participant.stage=v.stage;render(v.stage);lock()}catch(e){error(e);try{const v=await rpc('study_status',{p_token:participant.token});participant.stage=v.stage;render(v.stage)}catch(_){}}finally{busy=false;if(btn&&btn.isConnected)btn.disabled=false}}
function render(s){setStage(s);if(s===1)return listing();if(s===2)return recall();if(s===3)return judgment();if(s===4)return done();welcome()}
function welcome(){html(`<h1>중고거래 상품정보 인식 연구</h1>
<p>이 연구는 중고거래 게시글의 정보 제시 방식에 따라 상품정보를 기억하는 정도와 판매자 책임 판단이 어떻게 달라지는지 알아보기 위한 실험입니다. 약 5~8분이 소요됩니다.</p>
<div class="notice warning">거래글을 확인한 뒤 다음 단계로 이동하면 다시 볼 수 없습니다. 외부 메모나 스크린샷을 이용한 기록은 삼가 주세요.</div>
<p class="muted">참여는 자발적이며 언제든 중단할 수 있습니다. 이름과 전화번호는 수집하지 않습니다. 미성년자는 연구자가 마련한 보호자 동의 절차를 먼저 거쳐야 합니다. 실제 배포 전 연구자 연락처와 자료 보존 기간 등 필요한 연구 안내를 기재해 주세요.</p>
<form id="consent"><label class="option"><input type="checkbox" required> 연구 안내를 읽었으며 자발적으로 참여합니다.</label><button type="submit">동의하고 시작하기</button></form>`);
document.getElementById('consent').onsubmit=async e=>{e.preventDefault();if(busy)return;busy=true;e.target.querySelector('button').disabled=true;try{participant=await rpc('study_start');sessionStorage.setItem('study_token',participant.token);render(1);lock()}catch(x){error(x);e.target.querySelector('button').disabled=false}finally{busy=false}}}
function listing(){
 startTime=Date.now();
 const aText=`사이즈는 95(M)이고,\n2025년 9월쯤 구매해서 약 1년 정도 착용했습니다.\n평소 편하게 입기 좋고 디자인도 무난해서 자주 입었던 옷입니다.\n전체적으로 상태 좋으며,\n소매 쪽이나 앞부분은 자세히 보면 사용감이 조금 있습니다.\n직거래는 신설동역에서 가능하고, 택배 거래는 3,000원 추가입니다.`;
 const bInfo=`<div class="attribute"><strong>상품 기본 정보</strong><span>브랜드: 아디다스</span><span>상품: 검정색 집업</span><span>사이즈: 95(M)</span><span>구매 시기: 2025년 9월</span><span>사용 기간: 약 1년</span><span>가격: 30,000원</span></div>
 <div class="attribute"><strong>상품 상태</strong><span>전체적으로 상태 좋음</span><span>소매 쪽 사용감 있음</span><span>앞부분 사용감 있음</span></div>
 <div class="attribute"><strong>거래 정보</strong><span>직거래: 신설동역</span><span>택배 거래: 가능 (3,000원 추가)</span></div>`;
 const embed=participant.grp==='A'
 ?'https://embed.figma.com/design/kk7rWoDRjkSej20gShtms3/%EC%9E%90%EA%B7%B9%EB%AC%BC?node-id=0-1&embed-host=share'
 :'https://embed.figma.com/design/kk7rWoDRjkSej20gShtms3/%EC%9E%90%EA%B7%B9%EB%AC%BC?node-id=3-1018&embed-host=share';
 html(`<div class="market-head"><span class="tag">연구용 가상 게시글</span><span class="condition">${participant.grp==='A'?'일반 게시글':'상품 정보'}</span></div>
 <h1 class="listing-title">아디다스 검정색 집업 판매합니다</h1>
 <div class="price">30,000원</div>
 <div class="figma-wrap"><iframe title="${participant.grp}집단 자극물 디자인" src="${embed}" allowfullscreen loading="eager"></iframe></div>
 <p class="muted figma-note">위 화면은 연구용 게시글 디자인입니다. 아래 상품 정보도 함께 확인해 주세요.</p>
 ${participant.grp==='A'?`<div class="listing">${aText}</div>`:`${bInfo}`}
 <form id="listingForm"><div class="notice">상품 정보를 충분히 확인해 주세요. 다음 단계로 이동하면 거래글을 다시 볼 수 없습니다.</div><button type="submit">확인 완료 · 다음 단계</button></form>`);
 document.getElementById('listingForm').onsubmit=e=>{e.preventDefault();advance(1,{elapsed:Math.min(3600,Math.floor((Date.now()-startTime)/1000))})}
}
function fields(key,heading,opts){return `<fieldset><legend>${heading}</legend>${opts.map((x,i)=>`<label class="option"><input type="radio" name="${key}" value="${i}" required> ${i+1}. ${x}</label>`).join('')}</fieldset>`}
function recall(){html(`<h1>상품 정보 재인 검사</h1><div class="notice">거래글을 다시 볼 수 없습니다. 앞서 확인한 내용에 근거해 답변해 주세요. 모든 문항에 응답해야 다음 단계로 이동할 수 있습니다.</div><form id="recallForm">${QUESTIONS.map((q,i)=>fields('q'+i,`문항 ${i+1}. ${q[0]}`,q[1])).join('')}<button type="submit">답변 확정 · 다음 단계</button></form>`);
 document.getElementById('recallForm').onsubmit=e=>{e.preventDefault();const d=Object.fromEntries(new FormData(e.target));if(Object.keys(d).length!==5)return;advance(2,d)}}
function judgment(){html(`<h1>분쟁 상황 및 판매자 책임 판단</h1>
 <div class="scenario"><strong>분쟁 상황</strong><p>당신은 앞서 확인한 중고거래 게시글의 아디다스 집업을 구매했습니다.</p><p>상품을 배송받아 보니, 구매 전 인지하지 못한 하자가 존재했습니다.</p><p>옷의 앞쪽 부근에 ‘이염’이 있었으며, 사실 당신은 인식하지 못하였지만 ‘사진 한쪽에 포함되어 있는 이염’이었던 것입니다.</p><p>이러한 상황에서 판매자의 책임과 관련해 다음 질문에 답해 주세요.</p></div>
 <div class="scale-guide"><strong>응답 기준</strong><div class="scale-row"><span>1점</span> 전혀 그렇지 않다</div><div class="scale-row"><span>2점</span> 그렇지 않다</div><div class="scale-row"><span>3점</span> 보통이다</div><div class="scale-row"><span>4점</span> 그렇다</div><div class="scale-row"><span>5점</span> 매우 그렇다</div></div>
 <form id="judgeForm">${ITEMS.map((group,gi)=>`<h2>${String.fromCharCode(65+gi)}. ${group[0]}</h2>${group[1].map((q,qi)=>{const n=gi*2+qi+1;return `<fieldset class="likert"><legend>${n}. ${q}</legend><div class="likert-options">${[1,2,3,4,5].map(v=>`<label><input type="radio" name="j${n}" value="${v}" required><span>${v}</span></label>`).join('')}</div><div class="likert-ends"><span>전혀 그렇지 않다</span><span>매우 그렇다</span></div></fieldset>`}).join('')}`).join('')}
 <button type="submit">최종 제출</button></form>`);
 document.getElementById('judgeForm').onsubmit=e=>{e.preventDefault();const d=Object.fromEntries(new FormData(e.target));if(Object.keys(d).length!==8)return;advance(3,d)}}
function done(){sessionStorage.removeItem('study_token');html(`<h1>응답이 제출되었습니다.</h1><p>연구에 참여해 주셔서 감사합니다.</p><p class="muted">참여 코드: ${participant.token}</p><div class="notice">최종 제출 후 응답을 수정하거나 이전 거래글을 다시 열 수 없습니다.</div>`)}
(async()=>{if(!configured()){html('<h1>초기 설정이 필요합니다.</h1><p><code>config.js</code>의 Supabase URL과 공개 키를 확인해 주세요.</p>');return}try{const token=sessionStorage.getItem('study_token');if(token){const s=await rpc('study_status',{p_token:token});if(s.stage){participant=s;render(s.stage);lock();return}sessionStorage.removeItem('study_token')}welcome()}catch(e){html('<h1>연결할 수 없습니다.</h1><p>Supabase 설정과 네트워크 상태를 확인한 뒤 새로고침해 주세요.</p><p class="muted"></p>');app.querySelector('.muted').textContent=e.message}})();
