import { config } from "./config.js";
const $=id=>document.getElementById(id);
const ready=config.firebase.apiKey!=="REPLACE_ME"&&!config.workerUrl.includes("REPLACE_ME");
if(!ready){$("saveStatus").textContent="교사 설정이 필요해요. Firebase와 AI 연결을 완료해 주세요."; $("save").disabled=true;$("ask").disabled=true;}
else {
  // Pin and review SDK versions before classroom deployment.
  const [{initializeApp},{getAuth,signInAnonymously},{getFirestore,doc,setDoc,serverTimestamp}]=await Promise.all([
    import("https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js"),
    import("https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js"),
    import("https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js")
  ]);
  const app=initializeApp(config.firebase),auth=getAuth(app),db=getFirestore(app);
  let user;try{user=(await signInAnonymously(auth)).user;}catch{$("saveStatus").textContent="로그인에 실패했어요. 선생님께 알려 주세요.";$("save").disabled=true;$("ask").disabled=true;}
  if(user){
    $("save").onclick=async()=>{const content=$("note").value.trim();if(!content)return;try{await setDoc(doc(db,"users",user.uid,"notes","latest"),{content,updatedAt:serverTimestamp()});$("saveStatus").textContent="저장했어요!";}catch{$("saveStatus").textContent="저장에 실패했어요."; }};
    $("ask").onclick=async()=>{const question=$("question").value.trim();if(!question)return;$("ask").disabled=true;$("answer").textContent="답변을 기다리는 중...";
      try{const token=await user.getIdToken();const res=await fetch(config.workerUrl.replace(/\/$/,"")+"/ask",{method:"POST",headers:{"Content-Type":"application/json",Authorization:"Bearer "+token},body:JSON.stringify({question})});const data=await res.json();$("answer").textContent=res.ok?data.answer:(data.error||"잠시 후 다시 시도해 주세요.");}
      catch{$("answer").textContent="연결에 실패했어요.";}finally{$("ask").disabled=false;}
    };
  }
}
