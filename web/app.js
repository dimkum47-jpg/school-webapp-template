import { config } from "./config.js";
const $ = id => document.getElementById(id);
const firebaseReady = Boolean(config.firebase?.apiKey && config.firebase.apiKey !== "REPLACE_ME");
const aiReady = Boolean(config.workerUrl && !config.workerUrl.includes("REPLACE_ME"));

$("save").disabled = true;
$("ask").disabled = true;
$("saveStatus").textContent = firebaseReady ? "Firebase에 연결하는 중..." : "Firebase 설정이 필요해요.";
$("answer").textContent = aiReady ? "" : "AI 질문 기능은 교사 설정 후 사용할 수 있어요.";

if (firebaseReady) {
  try {
    const [{ initializeApp }, { getAuth, signInAnonymously }, { getFirestore, doc, setDoc, serverTimestamp }] = await Promise.all([
      import("https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js"),
      import("https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js"),
      import("https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js")
    ]);
    const app = initializeApp(config.firebase);
    const auth = getAuth(app);
    const db = getFirestore(app);
    const user = (await signInAnonymously(auth)).user;
    $("save").disabled = false;
    $("saveStatus").textContent = "로그인 완료! 학습 메모를 저장할 수 있어요.";

    $("save").onclick = async () => {
      const content = $("note").value.trim();
      if (!content) { $("saveStatus").textContent = "학습 내용을 먼저 입력해 주세요."; return; }
      $("save").disabled = true;
      try {
        await setDoc(doc(db, "users", user.uid, "notes", "latest"), { content, updatedAt: serverTimestamp() });
        $("saveStatus").textContent = "저장했어요!";
      } catch (error) {
        console.error("Firestore save failed", error);
        $("saveStatus").textContent = "저장에 실패했어요. 보안 규칙과 연결을 확인해 주세요.";
      } finally { $("save").disabled = false; }
    };

    if (aiReady) {
      $("ask").disabled = false;
      $("ask").onclick = async () => {
        const question = $("question").value.trim();
        if (!question) return;
        $("ask").disabled = true;
        $("answer").textContent = "답변을 기다리는 중...";
        try {
          const token = await user.getIdToken();
          const res = await fetch(config.workerUrl.replace(/\/$/, "") + "/ask", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
            body: JSON.stringify({ question })
          });
          const data = await res.json();
          $("answer").textContent = res.ok ? data.answer : (data.error || "잠시 후 다시 시도해 주세요.");
        } catch (error) {
          console.error("AI request failed", error);
          $("answer").textContent = "연결에 실패했어요.";
        } finally { $("ask").disabled = false; }
      };
    }
  } catch (error) {
    console.error("Firebase initialization failed", error);
    $("saveStatus").textContent = "Firebase 연결 또는 로그인에 실패했어요. 선생님께 알려 주세요.";
  }
}
