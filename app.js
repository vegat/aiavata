import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.165.0/build/three.module.js';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.165.0/examples/jsm/controls/OrbitControls.js';

const TAGS = {
  'zastanawia się': 'think',
  'śmieje się': 'laugh',
  'grozi palcem': 'warn'
};

class Character {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.mouthOpen = 0;
    this.mouthTarget = 0;
    this.speaking = false;
    this.clock = new THREE.Clock();
    this.actionTimer = 0;
    this.activeAction = null;

    this.build();
    scene.add(this.group);
  }

  build() {
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x4fb3ff, roughness: 0.4, metalness: 0.1 });
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xf1c27d, roughness: 0.6 });
    const eyeWhiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 });
    const eyeIrisMat = new THREE.MeshStandardMaterial({ color: 0x152238 });

    const torso = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 1.4, 4.2, 16), bodyMat);
    torso.position.y = 2.1;
    this.group.add(torso);

    const head = new THREE.Mesh(new THREE.SphereGeometry(1.4, 24, 16), skinMat);
    head.position.y = 4.9;
    this.head = head;
    this.group.add(head);

    const hat = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 1.2, 0.6, 12), new THREE.MeshStandardMaterial({ color: 0x1f2937 }));
    hat.position.set(0, 6.0, 0);
    this.group.add(hat);

    const eyeGroup = new THREE.Group();
    const eyeLeft = new THREE.Mesh(new THREE.SphereGeometry(0.35, 16, 12), eyeWhiteMat);
    eyeLeft.position.set(-0.5, 5.1, 1.0);
    const irisLeft = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 12), eyeIrisMat);
    irisLeft.position.set(-0.5, 5.1, 1.34);
    const eyeRight = eyeLeft.clone();
    eyeRight.position.x = 0.5;
    const irisRight = irisLeft.clone();
    irisRight.position.x = 0.5;
    eyeGroup.add(eyeLeft, eyeRight, irisLeft, irisRight);
    this.eyes = { irisLeft, irisRight, group: eyeGroup };
    this.group.add(eyeGroup);

    const mouthGeo = new THREE.BoxGeometry(0.9, 0.18, 0.4);
    mouthGeo.translate(0, -0.2, 1.2);
    const mouth = new THREE.Mesh(mouthGeo, new THREE.MeshStandardMaterial({ color: 0x2b1b12 }));
    mouth.position.set(0, 4.3, 0);
    this.mouth = mouth;
    this.group.add(mouth);

    const armMat = new THREE.MeshStandardMaterial({ color: 0x2267aa, roughness: 0.5 });
    const armGeo = new THREE.CylinderGeometry(0.35, 0.45, 2.4, 12);
    this.leftArm = new THREE.Mesh(armGeo, armMat);
    this.rightArm = new THREE.Mesh(armGeo, armMat);
    this.leftArm.position.set(-1.8, 2.7, 0);
    this.rightArm.position.set(1.8, 2.7, 0);
    this.leftArm.rotation.z = Math.PI / 4;
    this.rightArm.rotation.z = -Math.PI / 4;
    this.group.add(this.leftArm, this.rightArm);
  }

  setSpeaking(isSpeaking) {
    this.speaking = isSpeaking;
    if (!isSpeaking) {
      this.mouthTarget = 0;
    }
  }

  triggerMouthPulse(intensity = 1) {
    this.mouthTarget = 0.5 * intensity;
  }

  playAction(type, duration = 1600) {
    this.activeAction = type;
    this.actionTimer = duration;
  }

  update(delta) {
    const time = performance.now() * 0.001;
    const idleAmount = 0.08;
    const breathing = Math.sin(time * 1.2) * 0.06;

    this.group.rotation.y = Math.sin(time * 0.4) * idleAmount;
    this.group.position.y = breathing;

    this.head.rotation.x = Math.sin(time * 0.6) * 0.1;
    this.head.rotation.y = Math.sin(time * 0.5) * 0.12;

    const eyeOffset = Math.sin(time * 1.8) * 0.08;
    this.eyes.irisLeft.position.x = -0.5 + eyeOffset;
    this.eyes.irisRight.position.x = 0.5 + eyeOffset;

    this.mouthOpen = THREE.MathUtils.lerp(this.mouthOpen, this.mouthTarget, 0.2);
    this.mouth.scale.y = 1 + this.mouthOpen * 2.2;

    if (!this.speaking) {
      this.mouthTarget = Math.max(this.mouthTarget - delta * 1.2, 0);
    }

    if (this.speaking && Math.random() > 0.7) {
      this.triggerMouthPulse(0.5 + Math.random() * 0.5);
    }

    if (this.activeAction) {
      this.actionTimer -= delta * 1000;
      if (this.actionTimer <= 0) {
        this.activeAction = null;
      }
    }

    this.animateAction(time);
  }

  animateAction(time) {
    this.leftArm.rotation.z = Math.PI / 4;
    this.rightArm.rotation.z = -Math.PI / 4;
    this.leftArm.rotation.x = 0;
    this.rightArm.rotation.x = 0;

    if (!this.activeAction) {
      return;
    }

    switch (this.activeAction) {
      case 'think':
        this.head.rotation.y = Math.sin(time * 2) * 0.25;
        this.leftArm.rotation.x = -0.8;
        break;
      case 'laugh':
        this.mouthTarget = 0.9;
        this.group.position.y += Math.sin(time * 12) * 0.04;
        break;
      case 'warn':
        this.rightArm.rotation.z = -Math.PI / 6;
        this.rightArm.rotation.x = -0.6 + Math.sin(time * 8) * 0.2;
        break;
      default:
        break;
    }
  }
}

class SceneManager {
  constructor() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0b1020);
    this.camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    this.camera.position.set(0, 4.8, 10);
    this.clock = new THREE.Clock();

    const container = document.getElementById('canvas-container');
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);
    this.renderer = renderer;

    this.controls = new OrbitControls(this.camera, renderer.domElement);
    this.controls.enablePan = false;
    this.controls.enableZoom = false;
    this.controls.target.set(0, 4.5, 0);

    const ambient = new THREE.AmbientLight(0xffffff, 0.7);
    const dir = new THREE.DirectionalLight(0xffffff, 0.9);
    dir.position.set(4, 8, 5);
    this.scene.add(ambient, dir);

    const ground = new THREE.Mesh(new THREE.CircleGeometry(8, 40), new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.9, metalness: 0 }));
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = 0;
    this.scene.add(ground);

    this.character = new Character(this.scene);

    window.addEventListener('resize', () => this.onResize());
    this.onResize();

    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  animate() {
    requestAnimationFrame(this.animate);
    const delta = this.clock?.getDelta?.() ?? 0.016;
    this.character.update(delta);
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  onResize() {
    const container = document.getElementById('canvas-container');
    const width = container.clientWidth;
    const height = container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }
}

function parseSegments(input) {
  const segments = [];
  const regex = /\[(.+?)\]/g;
  let lastIndex = 0;
  let match;
  while ((match = regex.exec(input)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: 'text', value: input.slice(lastIndex, match.index).trim() });
    }
    const tagName = match[1].trim();
    segments.push({ type: 'tag', value: tagName });
    lastIndex = regex.lastIndex;
  }
  const trailing = input.slice(lastIndex).trim();
  if (trailing) {
    segments.push({ type: 'text', value: trailing });
  }
  return segments.filter(Boolean);
}

function speakSegment(text, character) {
  return new Promise((resolve) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'pl-PL';
    utterance.pitch = 1.02;
    utterance.rate = 1.02;

    const mouthInterval = setInterval(() => {
      if (!character.speaking) return;
      character.triggerMouthPulse(0.4 + Math.random() * 0.6);
    }, 120);

    utterance.onstart = () => character.setSpeaking(true);
    utterance.onboundary = () => character.triggerMouthPulse(0.4 + Math.random() * 0.6);
    utterance.onend = () => {
      clearInterval(mouthInterval);
      character.setSpeaking(false);
      resolve();
    };

    speechSynthesis.speak(utterance);
  });
}

async function playSequence(segments, character, options) {
  for (const segment of segments) {
    if (segment.type === 'tag') {
      const mapped = TAGS[segment.value.toLowerCase()];
      if (mapped) {
        character.playAction(mapped);
      }
      continue;
    }

    if (segment.type === 'text' && segment.value) {
      await speakSegment(segment.value, character);
    }
  }

  if (options.loopIdle) {
    character.playAction(null);
  }
}

function init() {
  const scene = new SceneManager();
  const textarea = document.getElementById('speech-text');
  const speakBtn = document.getElementById('speak-btn');
  const loopIdle = document.getElementById('loop-idle');

  speakBtn.addEventListener('click', () => {
    const text = textarea.value.trim();
    if (!text) return;
    const segments = parseSegments(text);
    playSequence(segments, scene.character, { loopIdle: loopIdle.checked });
  });
}

document.addEventListener('DOMContentLoaded', init);
