(() => {
  const wizard = document.querySelector("[data-wizard]");
  if (!wizard) {
    return;
  }

  const steps = Array.from(wizard.querySelectorAll("[data-step]"));
  const primaryButton = wizard.querySelector("[data-primary]");
  const stepLabel = wizard.querySelector("[data-step-label]");
  const dots = Array.from(wizard.querySelectorAll("[data-step-dot]"));

  const emailInput = wizard.querySelector("[data-login-email]");
  const passwordInput = wizard.querySelector("[data-login-password]");
  const guestButton = wizard.querySelector("[data-guest]");

  const roleTitle = wizard.querySelector("[data-role-title]");
  const roleObjective = wizard.querySelector("[data-role-objective]");
  const roleTips = wizard.querySelector("[data-role-tips]");

  const toggleButtons = Array.from(wizard.querySelectorAll("[data-toggle]"));
  const avatarOptions = Array.from(wizard.querySelectorAll("[data-avatar-option]"));
  const wardrobeCategories = Array.from(wizard.querySelectorAll("[data-category]"));

  const cameraFeed = wizard.querySelector("[data-camera-feed]");
  const meshCanvas = wizard.querySelector("[data-mesh-canvas]");
  const cameraStatus = wizard.querySelector("[data-camera-status]");
  const moodFace = wizard.querySelector("[data-avatar-mood]");
  const moodLabel = wizard.querySelector("[data-mood-label]");

  const roles = [
    {
      name: "Lider Reactivo",
      objective: "Coordina sin interrumpir.",
      tips: [
        "Espera 3 segundos antes de responder.",
        "Pregunta antes de reasignar tareas.",
      ],
    },
    {
      name: "Colaborador Inseguro",
      objective: "Expresa tu desacuerdo.",
      tips: [
        "Evita 'quizas' o 'tal vez'.",
        "Da una razon concreta en 1 frase.",
      ],
    },
    {
      name: "Individualista Abrumado",
      objective: "Participa breve y pide aclaraciones.",
      tips: [
        "Haz 1 pregunta corta.",
        "No intentes resolver todo solo.",
      ],
    },
    {
      name: "Integrante Pasivo-Desconectado",
      objective: "Participa al menos una vez.",
      tips: [
        "Di una idea corta o confirma: 'Estoy de acuerdo porque...'.",
      ],
    },
  ];

  const state = {
    step: 1,
    login: {
      email: "",
      password: "",
    },
    toggles: {
      mic: true,
      cam: true,
      opts: false,
    },
    avatar: {},
    wardrobe: {},
    role: null,
  };

  let cameraStream = null;
  let isCameraStarting = false;
  let animationId = null;
  let meshCtx = null;
  let sampleCanvas = null;
  let sampleCtx = null;
  let lastFrame = null;
  let smoothMotion = 0;
  let meshTime = 0;

  const defaultRoleContent = {
    title: "Rol asignado",
    objective: "Objetivo del rol.",
    tips: ["Consejo principal."],
  };

  const updateCameraStatus = (message, hidden) => {
    if (!cameraStatus) {
      return;
    }
    cameraStatus.textContent = message;
    cameraStatus.classList.toggle("is-hidden", hidden);
  };

  const setMoodState = (mood) => {
    if (moodFace) {
      moodFace.setAttribute("data-mood", mood);
    }
    if (moodLabel) {
      moodLabel.textContent = mood === "happy" ? "Feliz" : "Triste";
    }
  };

  const stopMeshLoop = () => {
    if (animationId) {
      cancelAnimationFrame(animationId);
      animationId = null;
    }
  };

  const stopCamera = (statusMessage = "Camara apagada") => {
    stopMeshLoop();
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      cameraStream = null;
    }
    if (cameraFeed) {
      cameraFeed.srcObject = null;
    }
    lastFrame = null;
    smoothMotion = 0;
    setMoodState("sad");
    updateCameraStatus(statusMessage, false);
  };

  const ensureCanvasSize = () => {
    if (!meshCanvas) {
      return;
    }
    const width = meshCanvas.clientWidth;
    const height = meshCanvas.clientHeight;
    if (meshCanvas.width !== width || meshCanvas.height !== height) {
      meshCanvas.width = width;
      meshCanvas.height = height;
    }
  };

  const computeMotion = () => {
    if (!cameraFeed || !sampleCtx || cameraFeed.readyState < 2) {
      return 0;
    }

    const width = sampleCanvas.width;
    const height = sampleCanvas.height;
    sampleCtx.drawImage(cameraFeed, 0, 0, width, height);
    const frame = sampleCtx.getImageData(0, 0, width, height);
    let motion = 0;
    if (lastFrame) {
      let diff = 0;
      const data = frame.data;
      const lastData = lastFrame.data;
      for (let i = 0; i < data.length; i += 4) {
        diff += Math.abs(data[i] - lastData[i]);
        diff += Math.abs(data[i + 1] - lastData[i + 1]);
        diff += Math.abs(data[i + 2] - lastData[i + 2]);
      }
      motion = diff / (width * height * 3 * 255);
    }
    lastFrame = frame;
    return motion;
  };

  const drawMesh = () => {
    if (!meshCanvas || !meshCtx) {
      return;
    }

    ensureCanvasSize();
    const width = meshCanvas.width;
    const height = meshCanvas.height;
    meshCtx.clearRect(0, 0, width, height);

    const motion = computeMotion();
    smoothMotion = smoothMotion * 0.85 + motion * 0.15;
    setMoodState(smoothMotion > 0.02 ? "happy" : "sad");

    const warp = 10 + smoothMotion * 60;
    meshTime += 0.02;

    meshCtx.save();
    meshCtx.strokeStyle = "rgba(120, 170, 255, 0.35)";
    meshCtx.lineWidth = 1;

    const lines = 12;
    for (let i = 0; i <= lines; i += 1) {
      const t = i / lines;
      const y = height * t;
      meshCtx.beginPath();
      for (let x = 0; x <= width; x += 24) {
        const wave = Math.sin((x / width) * Math.PI * 2 + meshTime + t * 3) * warp * (1 - t);
        const yy = y + wave;
        if (x === 0) {
          meshCtx.moveTo(x, yy);
        } else {
          meshCtx.lineTo(x, yy);
        }
      }
      meshCtx.stroke();
    }

    for (let j = 0; j <= lines; j += 1) {
      const t = j / lines;
      const x = width * t;
      meshCtx.beginPath();
      for (let y = 0; y <= height; y += 24) {
        const wave = Math.cos((y / height) * Math.PI * 2 + meshTime + t * 3) * warp * (1 - t);
        const xx = x + wave;
        if (y === 0) {
          meshCtx.moveTo(xx, y);
        } else {
          meshCtx.lineTo(xx, y);
        }
      }
      meshCtx.stroke();
    }
    meshCtx.restore();

    animationId = requestAnimationFrame(drawMesh);
  };

  const startMeshLoop = () => {
    if (!meshCanvas) {
      return;
    }
    if (!meshCtx) {
      meshCtx = meshCanvas.getContext("2d");
    }
    if (!sampleCanvas) {
      sampleCanvas = document.createElement("canvas");
      sampleCanvas.width = 64;
      sampleCanvas.height = 48;
      sampleCtx = sampleCanvas.getContext("2d", { willReadFrequently: true });
    }
    if (!animationId) {
      animationId = requestAnimationFrame(drawMesh);
    }
  };

  const startCamera = async () => {
    if (!cameraFeed || cameraStream || isCameraStarting) {
      return;
    }
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      updateCameraStatus("Camara no disponible", false);
      return;
    }
    isCameraStarting = true;
    try {
      cameraStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false,
      });
      cameraFeed.srcObject = cameraStream;
      await cameraFeed.play();
      updateCameraStatus("Camara activa", true);
      startMeshLoop();
    } catch (error) {
      stopCamera("Permiso de camara denegado");
    } finally {
      isCameraStarting = false;
    }
  };

  const updateCameraState = () => {
    if (state.step === 3 && state.toggles.cam) {
      startCamera();
    } else {
      stopCamera();
    }
  };

  const setRoleContent = (role) => {
    if (!roleTitle || !roleObjective || !roleTips) {
      return;
    }

    roleTitle.textContent = role.title;
    roleObjective.textContent = role.objective;
    roleTips.innerHTML = "";
    role.tips.forEach((tip) => {
      const item = document.createElement("li");
      item.textContent = tip;
      roleTips.appendChild(item);
    });
  };

  const render = () => {
    const totalSteps = steps.length;
    const activeStep = steps.find((step) => Number(step.dataset.step) === state.step);

    steps.forEach((step) => {
      const isActive = Number(step.dataset.step) === state.step;
      step.classList.toggle("is-active", isActive);
    });

    if (stepLabel) {
      stepLabel.textContent = `Paso ${state.step}/${totalSteps}`;
    }

    dots.forEach((dot, index) => {
      const stepIndex = index + 1;
      dot.classList.toggle("is-active", stepIndex === state.step);
      dot.classList.toggle("is-complete", stepIndex < state.step);
    });

    if (primaryButton && activeStep) {
      primaryButton.textContent = activeStep.dataset.primaryLabel || "Continuar";
    }

    if (primaryButton) {
      const loginEmpty = !state.login.email && !state.login.password;
      primaryButton.disabled = state.step === 2 && loginEmpty;
    }

    wizard.classList.toggle("is-split", state.step === 3);
    updateCameraState();
  };

  const setStep = (nextStep) => {
    const totalSteps = steps.length;
    state.step = Math.min(Math.max(nextStep, 1), totalSteps);
    render();
  };

  const assignRole = () => {
    const role = roles[Math.floor(Math.random() * roles.length)];
    state.role = role;
    setRoleContent({
      title: role.name,
      objective: role.objective,
      tips: role.tips,
    });
  };

  const resetWizard = () => {
    state.login.email = "";
    state.login.password = "";
    state.avatar = {};
    state.wardrobe = {};
    state.role = null;
    state.toggles = {
      mic: true,
      cam: true,
      opts: false,
    };
    stopCamera();
    setMoodState("sad");

    if (emailInput) {
      emailInput.value = "";
    }

    if (passwordInput) {
      passwordInput.value = "";
    }

    avatarOptions.forEach((button) => {
      button.classList.remove("is-selected");
    });

    wardrobeCategories.forEach((category) => {
      category.querySelectorAll("[data-item]").forEach((item) => {
        item.classList.remove("is-selected");
      });
    });

    toggleButtons.forEach((button) => {
      const key = button.dataset.toggle;
      const isOn = Boolean(state.toggles[key]);
      button.classList.toggle("is-on", isOn);
      button.setAttribute("aria-pressed", String(isOn));
    });

    setRoleContent(defaultRoleContent);
  };

  if (emailInput) {
    emailInput.addEventListener("input", (event) => {
      state.login.email = event.target.value.trim();
      render();
    });
  }

  if (passwordInput) {
    passwordInput.addEventListener("input", (event) => {
      state.login.password = event.target.value.trim();
      render();
    });
  }

  if (guestButton) {
    guestButton.addEventListener("click", () => {
      setStep(3);
    });
  }

  toggleButtons.forEach((button) => {
    const key = button.dataset.toggle;
    const isOn = Boolean(state.toggles[key]);
    button.classList.toggle("is-on", isOn);
    button.setAttribute("aria-pressed", String(isOn));

    button.addEventListener("click", () => {
      state.toggles[key] = !state.toggles[key];
      button.classList.toggle("is-on", state.toggles[key]);
      button.setAttribute("aria-pressed", String(state.toggles[key]));
      updateCameraState();
    });
  });

  avatarOptions.forEach((button) => {
    button.addEventListener("click", () => {
      button.classList.toggle("is-selected");
      state.avatar[button.dataset.avatarOption] = button.classList.contains("is-selected");
    });
  });

  wardrobeCategories.forEach((category) => {
    const items = Array.from(category.querySelectorAll("[data-item]"));
    items.forEach((item) => {
      item.addEventListener("click", () => {
        items.forEach((chip) => chip.classList.remove("is-selected"));
        item.classList.add("is-selected");
        state.wardrobe[category.dataset.category] = item.dataset.item;
      });
    });
  });

  if (primaryButton) {
    primaryButton.addEventListener("click", () => {
      if (primaryButton.disabled) {
        return;
      }

      if (state.step === 5) {
        assignRole();
      }

      if (state.step === 7) {
        resetWizard();
        setStep(1);
        return;
      }

      setStep(state.step + 1);
    });
  }

  setRoleContent(defaultRoleContent);
  updateCameraStatus("Camara apagada", false);
  setMoodState("sad");
  render();
})();
