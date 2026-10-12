/* =========================================================
 * 心愿卡 · 纯前端 Demo
 * 第一轮：第一幕 + 第二幕前半（双视角、阿杰委托、纸飞机、小敏收卡）
 * 第二轮：小敏 8 道问题 → 偏好摘要 → 3 件商品 → 详情 → 模拟下单 → 退款闭环
 * 全部 mock 数据；已预留 generateProfile / generateGifts 真实模型接口（见文末）。
 * ========================================================= */
(function () {
  "use strict";

  /* ================= mock 数据 ================= */
  var CARD = {
    from: "阿杰",
    to: "小敏",
    amount: 500,
    observe: "她最近总在加班，说想开始运动，但一直没时间。",
    blessing: "生日快乐。最近辛苦了，想送你一件真正喜欢的东西。"
  };

  // 商品对齐 catalog_image_manifest.csv（home_01 / style_01 / care_09）
  // 图片状态 missing → 统一走分类占位 SVG（assets/placeholders/*.svg）
  var CATALOG = [
    {
      itemId: "home_01", title: "暖光睡眠灯", price: 189, category: "家居生活", image: "",
      tags: ["无频闪", "三档调光", "定时关闭", "暖白灯罩"],
      shop: "灯语生活馆", review: "4.8 · 多数评价提到光线柔和、夜里不刺眼。",
      whyForRecipient: "睡前一点暖光，比手机屏幕更放松，适合想开始规律作息的你。",
      whyFromGiver: "阿杰看到你最近总加班、想让你好好休息，会想送一盏不打扰的灯。",
      insightUsed: "作息与运动启动都需要低门槛的陪伴物。",
      tradeoff: "偏氛围而非功能，若更想要实用工具可能不是首选。"
    },
    {
      itemId: "style_01", title: "羊毛围巾", price: 259, category: "穿搭配饰", image: "",
      tags: ["100% 羊毛", "不扎脖子", "经典燕麦色", "秋冬百搭"],
      shop: "素织物语", review: "4.9 · 评价集中在亲肤不扎、颜色显白。",
      whyForRecipient: "天气转凉，一件百搭的围巾保暖又有质感，通勤路上正好用得上。",
      whyFromGiver: "阿杰在意你上班路上的体感，会想送你一件每天都能戴的单品。",
      insightUsed: "工作与通勤场景多，需要实用又有氛围的随身物。",
      tradeoff: "尺码与配色偏基础，若想要更出彩的设计感会略平淡。"
    },
    {
      itemId: "care_09", title: "助眠香薰机", price: 189, category: "个护放松", image: "",
      tags: ["静音雾化", "低压保护", "暖光可关", "小巧不占地"],
      shop: "山间气味", review: "4.7 · 多数提到雾量细、声音小、适合睡前。",
      whyForRecipient: "睡前一点喜欢的味道和雾气，帮你把节奏慢下来，更容易入睡。",
      whyFromGiver: "阿杰知道你最近睡得晚，会想送一件让睡前更松弛的小物。",
      insightUsed: "加班后的睡前需要低门槛的放松仪式。",
      tradeoff: "属于氛围好物，若期待实用功能更需斟酌。"
    }
  ];

  var CATEGORY_SVG = {
    "家居生活": "assets/placeholders/home.svg",
    "个护放松": "assets/placeholders/care.svg",
    "数码通勤": "assets/placeholders/tech.svg",
    "穿搭配饰": "assets/placeholders/style.svg",
    "兴趣好物": "assets/placeholders/hobby.svg"
  };

  /* =========================================================
   * 商品数据接入点（预留）
   * 优先加载 catalog_ready_15.json，其次 catalog_100.json；
   * 文件缺失时回退到内置 mock CATALOG（3 件实体商品）。
   * 真实模型接入后，generateGifts 从这里取候选商品。
   * ========================================================= */
  function normalizeItem(raw, idx) {
    var cat = raw.category || raw.categoryName || raw.category_id || "";
    function tagList(v) {
      if (Array.isArray(v)) return v;
      if (!v) return [];
      return String(v).split(/[,，]/).filter(Boolean);
    }
    return {
      itemId: raw.itemId || raw.id || raw.sku || ("catalog-" + idx),
      title: raw.title || raw.name || ("商品" + (idx + 1)),
      price: Number(raw.price || 0),
      category: typeof cat === "string" ? cat : (cat.name || ""),
      image: raw.image || raw.img || raw.imageUrl || raw.pic || "",
      tags: Array.isArray(raw.tags) ? raw.tags : tagList(raw.tags),
      shop: raw.shop || raw.shopName || raw.store || "",
      review: raw.review || raw.reviewSummary || raw.rating || "",
      whyForRecipient: raw.whyForRecipient || "",
      whyFromGiver: raw.whyFromGiver || "",
      insightUsed: raw.insightUsed || "",
      tradeoff: raw.tradeoff || "",
      // 四维匹配标签（商品池打分用）
      valueTags: tagList(raw.valueTags),
      sceneTags: tagList(raw.sceneTags),
      formTags: tagList(raw.formTags),
      aestheticTags: tagList(raw.aestheticTags),
      avoidTags: tagList(raw.avoidTags),
      ready: raw.ready !== false
    };
  }

  // mock 推荐文案占位（真实模型 generateGifts 接入后替换）
  function mockWhy(item) {
    var c = item.category || "";
    var why = {
      "家居生活": "给居家一点安心的质感，日常随手就能用上。",
      "个护放松": "回到家给自己几分钟放松，情绪会很不一样。",
      "数码通勤": "通勤路上更省心，把每天的小麻烦变顺。",
      "穿搭配饰": "一件好搭的单品，能陪你很久也很出彩。",
      "兴趣好物": "顺着你的兴趣添一件，用起来更有热情。"
    };
    return {
      whyForRecipient: item.whyForRecipient || why[c] || "贴合你的偏好，用得上的实在选择。",
      whyFromGiver: item.whyFromGiver || ("阿杰会想送你一件" + (c || "适合") + "里真正用得上的东西。"),
      insightUsed: item.insightUsed || ("偏好指向" + (c || "通用") + "、不追高价的实用方向。"),
      tradeoff: item.tradeoff || "更偏基础款，若想要更强的设计感可以再挑。"
    };
  }

  function loadCatalog() {
    var urls = [
      "assets/catalog-100.json",
      "catalog_ready_15.json",
      "data/catalog_ready_15.json",
      "catalog_100.json",
      "data/catalog_100.json"
    ];
    var i = 0;
    (function tryNext() {
      if (i >= urls.length) return; // 全部失败 → 保留内置 mock CATALOG
      var url = urls[i++];
      fetch(url)
        .then(function (r) { if (!r.ok) throw new Error("not found"); return r.json(); })
        .then(function (data) {
          var list = Array.isArray(data) ? data : (data.items || data.products || data.catalog || data.list || []);
          if (!Array.isArray(list) || !list.length) throw new Error("empty");
          var mapped = list.map(normalizeItem).filter(function (it) { return it.title && it.price > 0 && it.ready; });
          if (mapped.length) { CATALOG = mapped; probeCatalogImages(); }
        })
        .catch(function () { tryNext(); });
    })();
  }

  /* 商品图可用性探测：assets/catalog/<id>.webp 存在 → 进入可推荐池。
   * 后续往该目录补同名 <id>.webp 即可零改码扩池。 */
  var IMAGE_OK = {};
  function probeCatalogImages() {
    for (var i = 0; i < CATALOG.length; i++) {
      (function (it) {
        if (PROD_IMG[it.itemId]) { IMAGE_OK[it.itemId] = true; return; } // 旧实拍图兜底
        if (!it.image) return;
        var probe = new Image();
        probe.onload = function () { IMAGE_OK[it.itemId] = true; };
        probe.onerror = function () { IMAGE_OK[it.itemId] = false; };
        probe.src = it.image;
      })(CATALOG[i]);
    }
  }

  var QUESTIONS = [
    { key: "wish", title: "最近有没有什么一直想要，但没舍得买的？",
      options: ["有，我来说说","有，但我说不清","没有，帮我找找","我更想要惊喜","暂时不想回答"],
      inputWhen: "有，我来说说" },
    { key: "value", title: "你希望这份礼物最重要的价值是什么？",
      options: ["实用：日常真的用得上","氛围：让生活更有感觉","仪式感：想被认真记住","小众特别：不想撞款","惊喜：想被认真种草"] },
    { key: "scene", title: "你希望它更多出现在哪个生活场景里？",
      options: ["居家日常","工作与通勤","周末放松","运动与兴趣","外出与社交"] },
    { key: "form", title: "你更希望收到哪一种礼物形态？",
      options: ["轻巧小物：精致、不占地方","品质单品：一件好的，用得久","成套礼盒：开箱就有仪式感","设计感好物：好看比功能更重要","你帮我选：我更想先看推荐"] },
    { key: "attitude", title: "如果这份礼物只能优先满足一件事，你更希望是什么？",
      options: ["轻巧精致，不占地方","品质好，能用得久","心意比价格重要","选择最合适的，不追高价","不要让我有选择压力"] },
    { key: "aesthetic", title: "你的审美更接近哪一种？",
      options: ["简约干净","温暖柔和","复古文艺","潮流有趣","没有特别偏好"] },
    { key: "category", title: "你更希望从哪一类商品里找？",
      options: ["家居生活","个护放松","数码通勤","穿搭配饰","兴趣好物","都可以，按前面的选择"] },
    { key: "avoid", title: "有没有什么你不太想收到？",
      options: ["香水、口红这类","摆件或纯装饰","太私密的东西","我已经有类似的","暂时没有"] }
  ];

  var REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ================= 状态 ================= */
  var state = {
    view: "launch",
    active: "ajie",        // ajie | xiaomin | both
    ajieStage: "idle",     // idle | drawer | preview | sent
    flying: false,
    xmStage: "idle",       // idle | quiz | summary | recommend | detail | confirm | done
    quizIndex: 0,
    answers: {},
    editKey: null,
    profile: null,
    recommendations: [],
    selectedItem: null,
    shownIds: []       // 已展示过的商品（换一批去重）
  };

  /* ================= DOM ================= */
  function $(id) { return document.getElementById(id); }

  var flyer = $("flyer");
  var drawer = $("drawer");
  var modal = $("card-modal");
  var toast = $("toast");
  var panelAjie = $("panel-ajie");
  var panelXiaomin = $("panel-xiaomin");

  /* ================= 工具 ================= */
  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }
  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function scrollBottom(el) { el.scrollTop = el.scrollHeight; }
  function showToast(text) {
    toast.textContent = text;
    toast.classList.remove("hidden");
    clearTimeout(showToast._t);
    showToast._t = setTimeout(function () { toast.classList.add("hidden"); }, 2200);
  }
  // 截取选项“：”前的短标签（如“氛围：让生活更有感觉”→“氛围”）
  function shortLabel(s) {
    var i = s.indexOf("：");
    return i === -1 ? s : s.slice(0, i);
  }

  /* ============ 心愿卡信封面（聊天小图） ============ */
  function cardFaceHTML(extra) {
    return '<div class="envelope' + (extra ? " " + extra : "") + '" role="img" aria-label="来自' + CARD.from + '的心愿卡">' +
      '<div class="env-flap"></div>' +
      '<div class="env-stamp"><img src="assets/img/card-icon.png" alt=""></div>' +
      '<div class="env-postmark"></div>' +
      '<div class="env-body">' +
        '<span class="env-to">To 小敏</span>' +
        '<span class="env-title">来自' + CARD.from + 'の心愿卡</span>' +
      '</div>' +
      '<img class="env-seal" src="assets/img/card-icon.png" alt="">' +
      '</div>';
  }

  // 纸飞机素材（用户附件抠图）：原始机头朝左，飞行时用 JS 动态瞄准目标方向
  // （scaleX(-1) 镜像 + rotate 对准飞行角，见 runFlight 第三幕）
  var PLANE_IMG = '<img class="plane-img" src="assets/img/plane.png" alt="纸飞机">';

  /* ================= 视图切换 ================= */
  var navStack = [];

  function showView(name, opts) {
    opts = opts || {};
    if (!opts.fromBack && name !== state.view) {
      // 记录来路，供返回按钮回退（避免连续重复）
      if (navStack[navStack.length - 1] !== state.view) navStack.push(state.view);
    }
    state.view = name;
    var views = document.querySelectorAll(".view");
    for (var i = 0; i < views.length; i++) {
      views[i].classList.toggle("is-active", views[i].getAttribute("data-view") === name);
    }
    if (name === "experience") { applyActive(); updateTryTip(); }
    document.body.classList.toggle("insp-active", name === "inspiration");
    if (name === "inspiration") startInspiration(); else stopInspiration();
    updateBackButton();
  }

  /* ================= 全站返回按钮 ================= */
  function updateBackButton() {
    var btn = $("site-back");
    if (btn) btn.classList.toggle("hidden", state.view === "launch");
  }
  function goBack() {
    // 优先回退“上一个交互状态”
    if (!modal.classList.contains("hidden")) { closeCardModal(); return; }
    var fm = $("flow-modal");
    if (fm && !fm.classList.contains("hidden")) {
      // 详情页返回 → 回三卡列表；“你是否喜欢”三卡页返回 → 回“先按这个方向帮你找”
      if (state.view === "experience" && state.xmStage === "recommend") { renderSummary(); return; }
      if (state.view === "experience" && state.xmStage === "detail") {
        renderRecommend(state.recommendations); return;
      }
      closeFlowModal(); return;
    }
    if (drawer.classList.contains("open")) { closeDrawer(); return; }
    // 灵感页：返回 = 回上一幕；已在第一幕才退回上一页（首页）
    if (state.view === "inspiration" && insp.idx > 0) { goAct(insp.idx - 1); return; }
    var prev = navStack.pop();
    if (!prev) prev = "launch"; // 深层直接进入且无来路 → 回启动页
    showView(prev, { fromBack: true });
  }

  /* ================= 灵感来源页 · 四幕动画 ================= */
  var insp = { stage: null, acts: [], dots: [], idx: 0, timer: null };

  function initInspiration() {
    if (insp.stage) return;
    insp.stage = $("insp-stage");
    insp.acts = Array.prototype.slice.call(document.querySelectorAll("#insp-stage .act"));
    insp.dots = Array.prototype.slice.call(document.querySelectorAll("#act-dots .dot"));

    // 跳过 → 直达第四幕（结论页，含“开始体验”）
    $("insp-skip").addEventListener("click", function (e) {
      e.stopPropagation();
      goAct(insp.acts.length - 1);
    });
    // 仅点击“继续”按钮才推进到下一幕；不自动跳转、点击空白不跳转
    insp.stage.addEventListener("click", function (e) {
      if (e.target.closest(".act-continue")) { e.stopPropagation(); nextAct(); }
    });
    // 再看一遍 → 从第一幕重播
    var replay = $("insp-replay");
    if (replay) replay.addEventListener("click", function (e) { e.stopPropagation(); goAct(0); });
  }

  function startInspiration() {
    initInspiration();
    goAct(0);
  }
  function stopInspiration() {
    if (insp.timer) { clearTimeout(insp.timer); insp.timer = null; }
  }
  function goAct(i) {
    if (!insp.acts.length) return;
    i = Math.max(0, Math.min(i, insp.acts.length - 1));
    insp.idx = i;
    for (var k = 0; k < insp.acts.length; k++) insp.acts[k].classList.toggle("is-active", k === i);
    for (var d = 0; d < insp.dots.length; d++) insp.dots[d].classList.toggle("is-on", d === i);
    stopInspiration();
  }
  function nextAct() { goAct(insp.idx + 1); }

  /* ================= 双视角激活 ================= */
  function applyActive() {
    var active = state.active;
    var isMobile = window.matchMedia("(max-width: 767px)").matches;
    var both = active === "both";

    var ajieActive, xmActive;
    if (both) {
      // 桌面：两侧同时亮起；移动：默认只显示小敏侧（结果条可见，可手动切换看阿杰通知）
      ajieActive = !isMobile;
      xmActive = true;
    } else {
      ajieActive = active === "ajie";
      xmActive = active === "xiaomin";
    }

    panelAjie.classList.toggle("panel-active", ajieActive);
    panelAjie.classList.toggle("panel-inactive", !ajieActive);
    panelXiaomin.classList.toggle("panel-active", xmActive);
    panelXiaomin.classList.toggle("panel-inactive", !xmActive);

    var tabs = document.querySelectorAll(".role-tab");
    for (var i = 0; i < tabs.length; i++) {
      var role = tabs[i].getAttribute("data-role");
      var on;
      if (both) on = isMobile ? (role === "xiaomin") : true;
      else on = role === active;
      tabs[i].classList.toggle("is-active", on);
    }
  }

  /* ================= 心愿卡入口引导 ================= */
  var tryTipDismissed = false;
  function updateTryTip() {
    var tip = $("try-tip");
    if (!tip) return;
    tip.classList.toggle("hidden", tryTipDismissed || state.ajieStage !== "idle");
  }

  /* ================= 阿杰委托抽屉 ================= */
  var drawerStep = "form"; // form | preview —— 收起时记住停在哪一步，重开时恢复
  function showDrawerStep(step) {
    $("drawer-form").classList.toggle("hidden", step !== "form");
    $("drawer-preview").classList.toggle("hidden", step !== "preview");
    if (step === "preview") scrollBottom(drawer.querySelector(".drawer-scroll"));
  }
  function openDrawer() {
    if (state.ajieStage === "sent") return;
    tryTipDismissed = true; // 用户点击过心愿卡入口 → 引导弹窗永久消失
    updateTryTip();
    drawer.classList.add("open");
    showDrawerStep(drawerStep); // 收起前在哪一步，重开就回到哪一步
    state.ajieStage = drawerStep === "preview" ? "preview" : "drawer";
  }
  function closeDrawer() {
    drawer.classList.remove("open");
    if (state.ajieStage !== "sent") state.ajieStage = "idle";
  }
  function generateCard() {
    var blessing = $("input-bless").value.trim();
    if (blessing) CARD.blessing = blessing;
    CARD.observe = $("input-observe").value.trim();

    // 支付阶段：心愿卡直接以信封形态预览
    $("preview-card").innerHTML = cardFaceHTML("env-lg");
    $("gift-blessing").textContent = CARD.blessing;

    drawerStep = "preview";
    showDrawerStep("preview");
    state.ajieStage = "preview";
  }
  function payAndSend() {
    state.ajieStage = "sent";
    drawerStep = "form"; // 下一次打开抽屉从表单重新开始
    closeDrawer();
    showToast("支付成功，心愿卡已发送");

    var sentCard = renderAjieSent();
    var received = renderXiaominReceived();

    var fromRect = sentCard.getBoundingClientRect();
    var toRect = received.card.getBoundingClientRect();

    runFlight(fromRect, toRect).then(function () {
      revealReceived(received);
      state.active = "xiaomin";
      applyActive();
    });
  }
  function renderAjieSent() {
    var c = $("chat-ajie");
    var wrap = document.createElement("div");
    wrap.className = "msg out";
    // 已发送形态：无右上角爱心邮票，整体略靠右
    wrap.innerHTML = '<div class="bubble card-bubble">' + cardFaceHTML("env-sent") + "</div>";
    c.appendChild(wrap);
    scrollBottom(c);
    return wrap.querySelector(".envelope");
  }
  function renderXiaominReceived() {
    var c = $("chat-xiaomin");
    var before = $("xiaomin-flow");

    var sys = document.createElement("div");
    sys.className = "sys-note";
    sys.textContent = "你收到一张心愿卡";
    c.insertBefore(sys, before);

    var wrap = document.createElement("div");
    wrap.className = "msg in";
    wrap.style.opacity = "0";
    wrap.innerHTML =
      '<div class="bubble card-bubble">' + cardFaceHTML("env-recv") +
      '<p class="card-note">阿杰为你准备了一份心愿额度</p>' +
      '<p class="card-note-2">所有推荐都会在范围内</p>' +
      '<button class="btn btn-primary btn-open" type="button">打开看看</button></div>';
    c.insertBefore(wrap, before);
    scrollBottom(c);

    var card = wrap.querySelector(".envelope");
    var openBtn = wrap.querySelector(".btn-open");
    function openCard() { openCardModal(); }
    card.addEventListener("click", openCard);
    openBtn.addEventListener("click", openCard);

    return { wrap: wrap, sys: sys, card: card };
  }
  function revealReceived(received) {
    received.wrap.style.opacity = "1";
    if (REDUCED) return;
    received.wrap.animate(
      [{ transform: "scaleY(.82)", opacity: 0 }, { transform: "scaleY(1)", opacity: 1 }],
      { duration: 480, easing: "cubic-bezier(.22,.61,.36,1)", fill: "backwards" }
    );
    scrollBottom($("chat-xiaomin"));
  }

  /* ================= 纸飞机飞行 ================= */
  function runFlight(fromRect, toRect) {
    if (REDUCED) return Promise.resolve();

    var cx = window.innerWidth / 2;
    var cy = window.innerHeight / 2;
    var a = { x: fromRect.left + fromRect.width / 2, y: fromRect.top + fromRect.height / 2 };
    var b = { x: cx, y: cy };
    var c = { x: toRect.left + toRect.width / 2, y: toRect.top + toRect.height / 2 };

    var cw = 176, ch = 112, pw = 128, ph = 84; /* 纸飞机小一圈 */

    flyer.innerHTML = '<div class="flyer-card-inner">' + cardFaceHTML("env-sent") + "</div>";
    flyer.style.width = cw + "px";
    flyer.style.height = ch + "px";
    flyer.classList.remove("hidden");

    function tl(p, w, h) { return { x: p.x - w / 2, y: p.y - h / 2 }; }
    function setPos(x, y) { flyer.style.transform = "translate(" + x + "px," + y + "px)"; }

    var s1 = tl(a, cw, ch), m1 = tl(b, cw, ch);
    setPos(s1.x, s1.y);

    state.flying = true;
    setRoleSwitchEnabled(false);

    return animateTransform(flyer, s1, m1, 180)
      .then(function () {
        flyer.style.width = pw + "px";
        flyer.style.height = ph + "px";
        var m2 = tl(b, pw, ph);
        setPos(m2.x, m2.y);
        flyer.innerHTML = PLANE_IMG;
        flyer.animate(
          [{ transform: "translate(" + m2.x + "px," + m2.y + "px) scaleX(.35)" },
           { transform: "translate(" + m2.x + "px," + m2.y + "px) scaleX(1)" }],
          { duration: 240, easing: "cubic-bezier(.22,.61,.36,1)" }
        );
        return sleep(240);
      })
      .then(function () {
        var s2 = tl(b, pw, ph), e2 = tl(c, pw, ph);
        // 机头动态瞄准：素材已翻转为机头朝右上 15°，
        // 旋转 (飞行角 + 15°) 让机头始终指向目标
        var ang = Math.atan2(c.y - b.y, c.x - b.x) * 180 / Math.PI;
        var pl = flyer.querySelector(".plane-img");
        if (pl) pl.style.transform = "rotate(" + (ang + 15) + "deg)";
        var midX = (s2.x + e2.x) / 2;
        var arcY = Math.min(s2.y, e2.y) - 70;
        return flyer.animate([
          { transform: "translate(" + s2.x + "px," + s2.y + "px)" },
          { transform: "translate(" + midX + "px," + arcY + "px) rotate(-5deg)", offset: 0.5 },
          { transform: "translate(" + e2.x + "px," + e2.y + "px)" }
        ], { duration: 650, easing: "cubic-bezier(.45,.05,.55,.95)" }).finished;
      })
      .then(function () {
        flyer.classList.add("hidden");
        state.flying = false;
        setRoleSwitchEnabled(true);
      });
  }
  function animateTransform(el, from, to, dur) {
    var a = el.animate(
      [{ transform: "translate(" + from.x + "px," + from.y + "px)" },
       { transform: "translate(" + to.x + "px," + to.y + "px)" }],
      { duration: dur, easing: "cubic-bezier(.22,.61,.36,1)" }
    );
    a.onfinish = function () { el.style.transform = "translate(" + to.x + "px," + to.y + "px)"; };
    return a.finished;
  }
  function setRoleSwitchEnabled(enabled) {
    var sw = $("role-switch");
    sw.style.pointerEvents = enabled ? "" : "none";
    sw.style.opacity = enabled ? "" : ".4";
  }

  /* ================= 悬浮心愿卡 ================= */
  function openCardModal() {
    // 挑礼物流程进行中 → 重新呼出流程悬浮卡（内容保留）
    if (flowInProgress()) { openFlowModal(); return; }
    modal.classList.remove("hidden");
  }
  function closeCardModal() {
    modal.classList.add("hidden");
  }

  /* =========================================================
   * 第二轮 · mock 模型接口（预留真实接入点）
   * ========================================================= */
  function generateProfile(answers, observe, blessing) {
    var category = answers.category === "都可以，按前面的选择" ? "家居生活" : answers.category;
    var avoidTags = [];
    if (answers.avoid && answers.avoid !== "暂时没有") {
      var am = { "香水、口红这类": "香水和口红", "摆件或纯装饰": "摆件或纯装饰", "太私密的东西": "太私密的物品", "我已经有类似的": "已有类似物品" };
      avoidTags.push(am[answers.avoid] || shortLabel(answers.avoid));
    }
    var p = {
      value: shortLabel(answers.value),
      scene: answers.scene,
      form: shortLabel(answers.form),
      budgetAttitude: answers.attitude === "选择最合适的，不追高价" ? "最合适的，不追高价" : answers.attitude,
      aesthetic: answers.aesthetic,
      categoryPreference: category,
      categoryIsAny: answers.category === "都可以，按前面的选择",
      avoidTags: avoidTags
    };

    var derivedInsight = "她最近总在加班，说想开始运动，但一直没时间。";
    if (answers.wish === "有，我来说说" && answers.wishInput) {
      derivedInsight = "她明确提到想要：" + answers.wishInput;
    }
    var fitStrategy = "在" + p.categoryPreference + "里挑一件氛围感强、价格不追高的单品。";

    return {
      surfacePreferences: p,
      derivedInsight: derivedInsight,
      fitStrategy: fitStrategy,
      needClarification: false
    };
  }

  /* ============ 匹配池 + 池内随机（四维打分 → 合格池 → 随机抽 3） ============ */
  function hasImage(it) {
    return (it.image && IMAGE_OK[it.itemId]) || !!PROD_IMG[it.itemId];
  }

  function matchScore(it, profile) {
    var p = profile.surfacePreferences, s = 0;
    if (p.value && it.valueTags.indexOf(p.value) >= 0) s += 4;
    var sMap = { "居家日常": "居家日常", "工作与通勤": "工作通勤", "周末放松": "周末放松", "运动与兴趣": "运动兴趣", "外出与社交": "外出社交" };
    var sceneTag = sMap[p.scene];
    if (sceneTag && it.sceneTags.indexOf(sceneTag) >= 0) s += 3;
    if (p.form && p.form !== "你帮我选" && it.formTags.indexOf(p.form) >= 0) s += 2;
    if (p.aesthetic && p.aesthetic !== "没有特别偏好" && it.aestheticTags.indexOf(p.aesthetic) >= 0) s += 2;
    if (!profile.categoryIsAny && p.categoryPreference && it.category === p.categoryPreference) s += 2;
    // 价格贴合：不追高价 → 中低价位轻加分；心意优先 → 用足预算轻加分
    var frac = Number(it.price) / Number(CARD.amount || 500);
    if (p.budgetAttitude === "最合适的，不追高价") { if (frac <= 0.6) s += 1; }
    else if (p.budgetAttitude === "心意比价格重要") { if (frac >= 0.4) s += 1; }
    return s;
  }

  function shuffle(arr) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = arr[i]; arr[i] = arr[j]; arr[j] = t;
    }
    return arr;
  }

  function generateGifts(profile, balance, catalog) {
    // 1) 候选：有实物图 + 价格 <= 心愿卡余额
    var cand = catalog.filter(function (it) {
      return hasImage(it) && Number(it.price) <= Number(balance);
    });
    // 2) 四维打分 → 合格池（与最高分差 ≤3，上限 20 件；池太小则放宽到前 8 件保底）
    var scored = cand.map(function (it) { return { it: it, s: matchScore(it, profile) }; });
    scored.sort(function (a, b) { return b.s - a.s; });
    var maxS = scored.length ? scored[0].s : 0;
    var pool = scored.filter(function (x) { return x.s >= maxS - 3; }).slice(0, 20).map(function (x) { return x.it; });
    if (pool.length < 8 && scored.length > pool.length) pool = scored.slice(0, 8).map(function (x) { return x.it; });
    if (!pool.length && cand.length) pool = cand.slice();
    // 3) 换一批去重：排除已展示的；剩余不足 3 件时重置记录重新循环
    if (!state.shownIds) state.shownIds = [];
    var fresh = pool.filter(function (it) { return state.shownIds.indexOf(it.itemId) < 0; });
    if (fresh.length >= 3) pool = fresh;
    else if (pool.length >= 3) { state.shownIds = []; pool = pool; }
    // 4) 池内随机抽 3（同类目最多 2 件，避免三张卡一个味儿）
    var picks = [], catCount = {};
    var bag = shuffle(pool.slice());
    for (var i = 0; i < bag.length && picks.length < 3; i++) {
      var it = bag[i];
      if ((catCount[it.category] || 0) >= 2) continue;
      catCount[it.category] = (catCount[it.category] || 0) + 1;
      picks.push(it);
    }
    for (var k = 0; k < bag.length && picks.length < 3; k++) {
      if (picks.indexOf(bag[k]) < 0) picks.push(bag[k]);
    }
    for (var m = 0; m < picks.length; m++) state.shownIds.push(picks[m].itemId);
    return {
      recommendations: picks.map(function (it) {
        var w = mockWhy(it);
        return {
          itemId: it.itemId || it.id || ("catalog-" + it.title),
          title: it.title,
          price: Number(it.price),
          whyForRecipient: w.whyForRecipient,
          whyFromGiver: w.whyFromGiver,
          insightUsed: w.insightUsed,
          tradeoff: w.tradeoff
        };
      })
    };
  }

  function findCatalogItem(itemId) {
    for (var i = 0; i < CATALOG.length; i++) if (CATALOG[i].itemId === itemId) return CATALOG[i];
    return null;
  }

  /* ================= 第二轮 · 流程渲染（悬浮信纸卡，页面居中） ================= */
  var flowMode = { plain: false };
  function flowInProgress() {
    return state.xmStage === "quiz" || state.xmStage === "summary" ||
      state.xmStage === "recommend" || state.xmStage === "detail" || state.xmStage === "confirm";
  }
  function openFlowModal() { $("flow-modal").classList.remove("hidden"); }
  function closeFlowModal() {
    var fm = $("flow-modal");
    fm.classList.add("hidden");
    fm.classList.remove("dim");
  }

  function renderFlow(html, opts) {
    opts = opts || {};
    flowMode.plain = !!opts.plain;
    var fp = $("flow-paper"), fm = $("flow-modal");
    fp.classList.toggle("plain", flowMode.plain);
    // detailPaper：商品详情页（黄红渐变底 + 实物图全露出悬浮）
    fp.classList.toggle("detail-paper", !!opts.detailPaper);
    // float：透明悬浮模式（三卡推荐），无信纸底、遮罩加深
    fp.classList.toggle("float", !!opts.float);
    fm.classList.toggle("dim", !!opts.float);
    $("flow-content").innerHTML = html;
    openFlowModal();
  }
  function currentQuestion() { return QUESTIONS[state.quizIndex]; }

  function startQuiz() {
    closeCardModal();
    state.active = "xiaomin";
    applyActive();
    state.xmStage = "quiz";
    state.quizIndex = 0;
    state.answers = {};
    state.editKey = null;
    $("xiaomin-flow").innerHTML = "";
    var c = $("chat-xiaomin");
    var sys = document.createElement("div");
    sys.className = "sys-note";
    sys.textContent = "开始挑选礼物";
    c.insertBefore(sys, $("xiaomin-flow"));
    renderQuestion(0);
  }

  function renderQuestion(i) {
    var q = QUESTIONS[i];
    if (!q) return;
    state.quizIndex = i; // 同步状态题号：修改偏好跳题后 currentQuestion() 仍正确
    var opts = q.options.map(function (o) {
      var on = state.answers[q.key] === o ? " on" : "";
      return '<button class="opt' + on + '" type="button" data-answer="' + esc(o) + '">' + esc(o) + '</button>';
    }).join("");
    renderFlow(
      '<div class="quiz">' +
        '<div class="quiz-step">' +
          '<button class="quiz-nav" type="button" data-nav="-1" aria-label="上一题"' + (i === 0 ? " disabled" : "") + '>&lt;</button>' +
          '<span class="quiz-num">' + (i + 1) + ' / ' + QUESTIONS.length + '</span>' +
          '<button class="quiz-nav" type="button" data-nav="1" aria-label="下一题"' + (i === QUESTIONS.length - 1 ? " disabled" : "") + '>&gt;</button>' +
        '</div>' +
        '<div class="quiz-title">' + esc(q.title) + '</div>' +
        '<div class="quiz-opts">' + opts + '</div>' +
      '</div>'
    );
  }

  function renderWishInput() {
    renderFlow(
      '<div class="quiz">' +
        '<div class="quiz-title">把名字、品牌或者大概的样子写下来都可以。</div>' +
        '<textarea class="wish-input" id="wish-input" rows="3" placeholder="把名字、品牌或者大概的样子写下来都可以。"></textarea>' +
        '<button class="btn btn-primary" id="wish-confirm" type="button">继续</button>' +
      '</div>'
    );
  }

  function firstUnansweredIndex() {
    for (var i = 0; i < QUESTIONS.length; i++) {
      if (!state.answers[QUESTIONS[i].key]) return i;
    }
    return -1;
  }

  function advanceQuestion() {
    if (state.editKey) {
      // 修改偏好单题模式：改完直接回“先按这个方向帮你找”
      state.editKey = null;
      state.profile = generateProfile(state.answers, CARD.observe, CARD.blessing);
      renderSummary();
      return;
    }
    state.quizIndex++;
    if (state.quizIndex < QUESTIONS.length) {
      renderQuestion(state.quizIndex);
    } else {
      // 箭头跳题可能跳过未答项：答完最后一题仍有缺漏 → 跳回第一道未答题
      var fu = firstUnansweredIndex();
      if (fu >= 0) { showToast("还有题目没答完"); renderQuestion(fu); }
      else onQuizComplete();
    }
  }

  function onAnswer(q, answer) {
    state.answers[q.key] = answer;
    if (q.inputWhen && answer === q.inputWhen) {
      renderWishInput();
      return;
    }
    advanceQuestion();
  }

  function onQuizComplete() {
    state.profile = generateProfile(state.answers, CARD.observe, CARD.blessing);
    state.xmStage = "summary";
    renderSummary();
  }

  function summaryTags(p) {
    var tags = [p.value, p.scene, p.form, p.budgetAttitude, p.aesthetic, p.categoryPreference];
    if (p.avoidTags && p.avoidTags.length) {
      for (var i = 0; i < p.avoidTags.length; i++) tags.push("避开" + p.avoidTags[i]);
    }
    return tags;
  }

  function renderSummary() {
    var p = state.profile.surfacePreferences;
    var chips = summaryTags(p).map(function (t) {
      return '<span class="tag-chip">' + esc(t) + '</span>';
    }).join("");
    renderFlow(
      '<div class="summary">' +
        '<div class="summary-title title-butter">先按这个方向帮你找。</div>' +
        '<div class="summary-tags">' + chips + '</div>' +
        '<div class="summary-actions">' +
          '<button class="btn btn-primary" id="btn-go-pick" type="button">开始挑礼物</button>' +
          '<button class="btn btn-secondary" id="btn-edit-pref" type="button">修改偏好</button>' +
        '</div>' +
      '</div>'
    );
  }

  function renderEditPref() {
    var p = state.profile.surfacePreferences;
    var dims = [
      ["value", "价值", p.value],
      ["scene", "场景", p.scene],
      ["form", "形态", p.form],
      ["attitude", "选择倾向", p.budgetAttitude],
      ["aesthetic", "审美", p.aesthetic],
      ["category", "商品大类", p.categoryPreference],
      ["avoid", "避让项", p.avoidTags.length ? "避开" + p.avoidTags.join(" / ") : "暂不设避让"]
    ];
    var rows = dims.map(function (d) {
      return '<button class="edit-dim" type="button" data-key="' + d[0] + '">' +
        '<span>' + d[1] + '</span><em>' + esc(d[2]) + '</em></button>';
    }).join("");
    renderFlow(
      '<div class="summary">' +
        '<div class="summary-title">修改偏好</div>' +
        '<div class="edit-list">' + rows + '</div>' +
        '<button class="btn btn-primary" id="btn-edit-done" type="button">完成</button>' +
      '</div>'
    );
  }

  function editDimension(key) {
    var idx = -1;
    for (var i = 0; i < QUESTIONS.length; i++) if (QUESTIONS[i].key === key) { idx = i; break; }
    if (idx < 0) return;
    state.editKey = key;
    renderQuestion(idx);
  }

  function startRecommend() {
    var recs = generateGifts(state.profile, CARD.amount, CATALOG).recommendations;
    state.recommendations = recs;
    state.xmStage = "recommend";
    renderRecommend(recs);
  }

  // 三件商品实物照片（第9轮用户提供，方图 800×800）
  var PROD_IMG = {
    home_01: "assets/img/prod-lamp.jpg",
    style_01: "assets/img/prod-scarf.jpg",
    care_09: "assets/img/prod-diffuser.jpg"
  };
  function productImage(item) {
    if (!item) return "assets/placeholders/home.svg";
    // JSON 里的 image 路径以探测结果（IMAGE_OK）为准，避免 404 破图
    if (item.image && IMAGE_OK[item.itemId]) return item.image;
    return PROD_IMG[item.itemId || item.id] || CATEGORY_SVG[item.category] || "assets/placeholders/home.svg";
  }

  function renderRecommend(recs) {
    var cards = recs.map(function (g) {
      var item = findCatalogItem(g.itemId);
      var img = productImage(item);
      var tags = (item && item.tags ? item.tags : []).slice(0, 2).map(function (t) {
        return '<span class="prod-tag">' + esc(t) + '</span>';
      }).join("");
      return '<div class="prod-card" role="button" tabindex="0" data-itemid="' + g.itemId + '">' +
        '<img class="prod-img" src="' + img + '" alt="' + esc(g.title) + '">' +
        '<div class="prod-body">' +
          '<div class="prod-name-row">' +
            '<div class="prod-name">' + esc(g.title) + '</div>' +
            '<div class="prod-price">¥' + g.price + '</div>' +
          '</div>' +
          '<div class="prod-tags">' + tags + '</div>' +
          '<button class="btn btn-see" type="button">看看这件</button>' +
        '</div>' +
      '</div>';
    }).join("");
    renderFlow(
      '<div class="reco-head">你是否喜欢？</div>' +
      '<div class="reco">' + cards + '</div>' +
      '<div class="reco-swap"><button class="btn btn-swap" id="btn-swap" type="button">换一批</button></div>',
      { float: true }
    );
  }

  function renderDetail(item) {
    state.selectedItem = item;
    state.xmStage = "detail";
    var img = productImage(item);
    var tags = item.tags.map(function (t) { return '<span class="prod-tag">' + esc(t) + '</span>'; }).join("");
    renderFlow(
      '<div class="detail">' +
        '<button class="back-btn" id="btn-detail-back" type="button">‹ 返回</button>' +
        '<img class="detail-img" src="' + img + '" alt="' + esc(item.title) + '">' +
        '<div class="detail-name">' + esc(item.title) + '</div>' +
        '<div class="detail-price">¥' + item.price + '</div>' +
        '<div class="detail-tags">' + tags + '</div>' +
        '<div class="detail-shop">店铺 · ' + esc(item.shop || "匠心好物铺") + '</div>' +
        '<div class="detail-review">' + esc(item.review || "4.7 · 用户口碑良好。") + '</div>' +
        '<div class="detail-reason"><b>为什么适合你</b>' + esc(item.whyForRecipient) + '</div>' +
        '<div class="detail-tradeoff">' + esc(item.tradeoff) + '</div>' +
      '</div>' +
      '<div class="detail-action"><button class="btn btn-primary btn-block" id="btn-confirm-select" type="button">确认选择</button></div>',
      { plain: true, detailPaper: true }
    );
  }

  function renderConfirm(item) {
    state.xmStage = "confirm";
    renderFlow(
      '<div class="confirm">' +
        '<div class="confirm-card">' +
          '<div class="confirm-title">订单确认</div>' +
          '<div class="confirm-line">这件商品价格 ' + item.price + ' 元。</div>' +
          '<div class="confirm-line">由阿杰的心愿卡支付。</div>' +
          '<button class="btn btn-primary btn-block" id="btn-confirm-order" type="button">确认收下并完成订单</button>' +
        '</div>' +
      '</div>',
      { plain: true }
    );
  }

  function renderDone(item) {
    state.xmStage = "done";

    // 流程悬浮卡收起，完成态落回小敏聊天
    closeFlowModal();
    $("xiaomin-flow").innerHTML =
      '<div class="done">' +
        '<div class="done-title">心意已收下</div>' +
        '<div class="done-text">你选择了阿杰准备的「' + esc(item.title) + '」。这件商品已由心愿卡模拟支付。</div>' +
      '</div>';
    scrollBottom($("chat-xiaomin"));

    // 阿杰侧通知（显示商品价格与剩余退款，小敏侧不可见）
    var c = $("chat-ajie");
    var sys = document.createElement("div");
    sys.className = "sys-note";
    sys.textContent = "完成通知";
    c.appendChild(sys);
    var wrap = document.createElement("div");
    wrap.className = "msg in";
    wrap.innerHTML = '<div class="bubble">' +
      '小敏收下了「' + esc(item.title) + '」。<br>' +
      '本件商品 ' + item.price + ' 元，剩余金额已原路退回。</div>';
    c.appendChild(wrap);
    scrollBottom(c);

    state.active = "both";
    applyActive();
    showResultBar();

    // 聊天消息先出现，2s 后再弹「心意已收下」信封页
    clearTimeout(doneTimer);
    doneTimer = setTimeout(function () {
      if (state.view === "experience") $("done-modal").classList.remove("hidden");
    }, 2000);
  }
  var doneTimer = 0;

  function showResultBar() {
    var bar = $("result-bar");
    bar.innerHTML =
      '<span><b>1</b> 张心愿卡已发送</span>' +
      '<span><b>8</b> 个偏好已完成</span>' +
      '<span><b>3</b> 件商品已推荐</span>' +
      '<span><b>1</b> 件商品已完成模拟下单</span>';
    bar.classList.remove("hidden");
  }

  /* ================= 事件绑定 ================= */
  document.addEventListener("click", function (e) {
    var goto = e.target.closest("[data-goto]");
    if (goto) { showView(goto.getAttribute("data-goto")); return; }

    var roleTab = e.target.closest(".role-tab");
    if (roleTab && !state.flying) {
      state.active = roleTab.getAttribute("data-role");
      applyActive();
      return;
    }

    var close = e.target.closest("[data-close]");
    if (close) { closeCardModal(); return; }

    // 心意已收下弹窗：返回首页（整体重置到启动页）
    if (e.target.closest("#btn-done-home")) { location.reload(); return; }
  });

  // 第二轮流程点击（与第一轮监听器互补，元素不重叠）
  document.addEventListener("click", function (e) {
    var nav = e.target.closest(".quiz-nav");
    if (nav && !nav.disabled) {
      var ni = state.quizIndex + parseInt(nav.getAttribute("data-nav"), 10);
      if (ni >= 0 && ni < QUESTIONS.length) renderQuestion(ni);
      return;
    }
    var opt = e.target.closest(".opt");
    if (opt && opt.hasAttribute("data-answer")) {
      onAnswer(currentQuestion(), opt.getAttribute("data-answer"));
      return;
    }
    if (e.target.closest("#wish-confirm")) {
      state.answers.wishInput = ($("wish-input").value || "").trim();
      advanceQuestion();
      return;
    }
    if (e.target.closest("#btn-go-pick")) { startRecommend(); return; }
    if (e.target.closest("#btn-swap")) { startRecommend(); return; } // 换一批：重新随机并排除已展示
    if (e.target.closest("#btn-edit-pref")) { renderEditPref(); return; }
    if (e.target.closest("#btn-edit-done")) { renderSummary(); return; }
    var dim = e.target.closest(".edit-dim");
    if (dim) { editDimension(dim.getAttribute("data-key")); return; }
    // 三卡列表：点卡片任意位置（含“看看这件”按钮）进入详情
    var card = e.target.closest(".prod-card[data-itemid]");
    if (card) {
      var it = findCatalogItem(card.getAttribute("data-itemid"));
      if (it) renderDetail(it);
      return;
    }
    if (e.target.closest("#btn-detail-back")) { renderRecommend(state.recommendations); return; }
    if (e.target.closest("#btn-confirm-select")) { renderConfirm(state.selectedItem); return; }
    if (e.target.closest("#btn-confirm-order")) { renderDone(state.selectedItem); return; }
  });

  $("btn-open-drawer").addEventListener("click", openDrawer);
  $("drawer-handle").addEventListener("click", closeDrawer);
  $("btn-generate").addEventListener("click", generateCard);
  $("btn-pay").addEventListener("click", payAndSend);

  $("card-close").addEventListener("click", closeCardModal);
  $("btn-start-gift").addEventListener("click", startQuiz);
  $("site-back").addEventListener("click", goBack);

  /* ================= 声音：点击音效 + 背景音乐开关 ================= */
  function initAudio() {
    var bgm = $("bgm"), sfx = $("sfx-click");
    if (bgm) { bgm.volume = 0.34; }
    if (sfx) { sfx.volume = 0.55; }

    var bgmWanted = true;

    function tryPlayBgm() {
      if (!bgm || !bgmWanted) return;
      var p = bgm.play();
      if (p && p.catch) p.catch(function () { /* 自动播放被拦截，等首次交互 */ });
    }

    // 打开网站即尝试播放；被浏览器拦截时，首次交互补播
    tryPlayBgm();
    function unlockOnGesture() {
      tryPlayBgm();
      document.removeEventListener("pointerdown", unlockOnGesture, true);
      document.removeEventListener("keydown", unlockOnGesture, true);
    }
    document.addEventListener("pointerdown", unlockOnGesture, true);
    document.addEventListener("keydown", unlockOnGesture, true);

    // 每次点击触发点击音效（捕获阶段，任何元素都生效）
    document.addEventListener("click", function () {
      if (!sfx) return;
      try { sfx.currentTime = 0; } catch (e) {}
      var p = sfx.play();
      if (p && p.catch) p.catch(function () {});
    }, true);

    // 正上方图标：开关背景音乐
    var toggle = $("bgm-toggle");
    if (toggle) {
      toggle.addEventListener("click", function (e) {
        e.stopPropagation();
        bgmWanted = !bgmWanted;
        if (bgmWanted) { tryPlayBgm(); }
        else if (bgm) { bgm.pause(); }
        toggle.classList.toggle("is-off", !bgmWanted);
        toggle.setAttribute("aria-pressed", bgmWanted ? "true" : "false");
      });
    }
  }

  /* ================= 预置聊天记录（体验开始前的一段对话） ================= */
  function seedHistory() {
    var notePic =
      '<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">' +
      '<path d="M24 7l4.4 9 9.8 1.4-7.1 6.9 1.7 9.7L24 29.4l-8.8 4.6 1.7-9.7-7.1-6.9 9.8-1.4z" fill="none" stroke="#FFFDF8" stroke-width="2.2" stroke-linejoin="round"/>' +
      '<path d="M17 21h3.6l1.6-4 3 7.5 2-3.5h4.8" fill="none" stroke="#FFFDF8" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>' +
      '</svg>';
    var seed = [
      { type: "time", text: "昨天 20:23" },
      { side: "min", html: '<div class="bubble">给你看一篇写得特别真诚的种草笔记，就是我想要的那种感觉</div>' },
      { side: "min", html:
        '<div class="bubble note-bubble">' +
        '<p class="note-src">分享 · 笔记</p>' +
        '<p class="note-title">加班人的自愈清单：一盏睡前暖光</p>' +
        '<div class="note-pic">' + notePic + '</div>' +
        '<p class="note-from">来自 · 生活好物笔记</p>' +
        '</div>' },
      { quickReplies: true },
      { side: "jie", html: '<div class="bubble">看到啦，写得特别真诚。你最近老加班，我先记下了</div>' },
      { type: "time", text: "09:41" },
      { side: "min", html: '<div class="bubble">早上提醒你一下，今天可是我生日</div>' },
      { side: "jie", html: '<div class="bubble">忘不了，晚上见。我还有点东西要准备</div>' }
    ];

    // viewer: "ajie" → 小敏 in / 阿杰 out；"xiaomin" → 阿杰 in / 小敏 out
    function build(viewer) {
      var frag = document.createDocumentFragment();
      seed.forEach(function (s) {
        if (s.type === "time") {
          var t = document.createElement("div");
          t.className = "sys-note";
          t.textContent = s.text;
          frag.appendChild(t);
          return;
        }
        if (s.quickReplies) {
          if (viewer !== "ajie") return; // 快捷回复只出现在阿杰视角（他收到分享）
          var q = document.createElement("div");
          q.className = "quick-replies";
          q.innerHTML = '<span class="qr-chip">已阅</span><span class="qr-chip">绝了</span><span class="qr-chip">哈哈哈</span>';
          frag.appendChild(q);
          return;
        }
        var m = document.createElement("div");
        m.className = "msg " + ((viewer === "ajie") === (s.side === "min") ? "in" : "out");
        m.innerHTML = s.html;
        frag.appendChild(m);
      });
      return frag;
    }

    $("chat-ajie").appendChild(build("ajie"));
    $("chat-xiaomin").insertBefore(build("xiaomin"), $("xiaomin-flow"));
  }

  /* ================= 初始化 ================= */
  seedHistory();
  showView("launch");
  applyActive();
  loadCatalog();
  initAudio();
})();