import "./styles.css";
import * as THREE from "three";
import { loadTextAssets, createTextMaterial, Text } from "./Text";
import TouchTexture from "./TouchTexture";
import { EffectComposer, RenderPass, EffectPass } from "postprocessing";
import { WaterEffect } from "./WaterEffect";
global.THREE = THREE;
const createGeometry = require("three-bmfont-text");

const MSDFShader = require("three-bmfont-text/shaders/msdf");

console.clear();

export class App {
  constructor() {
    this.elWidth = 1330;
    this.elHeight = 192;

    this.renderer = new THREE.WebGLRenderer({
      antialias: false
    });
    // this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setSize(this.elWidth, this.elHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);

    this.composer = new EffectComposer(this.renderer);

    document.body.append(this.renderer.domElement);
    this.renderer.domElement.id = "webGLApp";

    // this.camera = new THREE.PerspectiveCamera(
    //   45,
    //   window.innerWidth / window.innerHeight,
    //   0.1,
    //   10000
    // );
    this.camera = new THREE.PerspectiveCamera(
      45,
      this.elWidth / this.elHeight,
      0.1,
      10000
    );
    // this.camera.position.z = 50;
    this.camera.position.z = 25;
    this.disposed = false;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xffffff);

    this.clock = new THREE.Clock();

    this.assets = {};
    this.raycaster = new THREE.Raycaster();
    this.hitObjects = [];

    this.touchTexture = new TouchTexture();

    this.subjects = [new Text(this)];

    this.tick = this.tick.bind(this);
    this.onResize = this.onResize.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);
    this.onTouchMove = this.onTouchMove.bind(this);

    this.init = this.init.bind(this);
    this.loader = new Loader();
    this.loadAssets().then(this.init);
  }

  loadAssets() {
    const loader = this.loader;

    return new Promise((resolve, reject) => {
      this.subjects.forEach(subject => subject.load(loader));

      loader.onComplete = () => {
        resolve();
      };
    });
  }

  initComposer() {
    console.log("init");
    const renderPass = new RenderPass(this.scene, this.camera);
    this.waterEffect = new WaterEffect({ texture: this.touchTexture.texture });
    const waterPass = new EffectPass(this.camera, this.waterEffect);
    waterPass.renderToScreen = true;
    renderPass.renderToScreen = false;
    this.composer.addPass(renderPass);
    this.composer.addPass(waterPass);
  }

  init() {
    this.touchTexture.initTexture();

    this.addHitPlane();
    this.subjects.forEach(subject => subject.init());
    this.initComposer();

    this.tick();

    window.addEventListener("resize", this.onResize);
    window.addEventListener("mousemove", this.onMouseMove);
    window.addEventListener("touchmove", this.onTouchMove);
  }

  onTouchMove(ev) {
    const touch = ev.targetTouches[0];
    this.onMouseMove({ clientX: touch.clientX, clientY: touch.clientY });
  }

  onMouseMove(ev) {
    const raycaster = this.raycaster;
    this.mouse = {
      x: ev.clientX / window.innerWidth,
      y: 1 - ev.clientY / window.innerHeight
    };
    this.touchTexture.addTouch(this.mouse);

    raycaster.setFromCamera(
      {
        x: (ev.clientX / window.innerWidth) * 2 - 1,
        y: -(ev.clientY / window.innerHeight) * 2 + 1
      },
      this.camera
    );

    this.subjects.forEach(subject => {
      if (subject.onMouseMove) {
        subject.onMouseMove(ev);
      }
    });
  }

  addHitPlane() {
    const viewSize = this.getViewSize();
    const geometry = new THREE.PlaneBufferGeometry(
      viewSize.width,
      viewSize.height,
      1,
      1
    );
    const material = new THREE.MeshBasicMaterial();
    const mesh = new THREE.Mesh(geometry, material);

    this.hitObjects.push(mesh);
  }

  getViewSize() {
    const fovInRadians = (this.camera.fov * Math.PI) / 180;
    const height = Math.abs(
      this.camera.position.z * Math.tan(fovInRadians / 2) * 2
    );

    return { width: height * this.camera.aspect, height };
  }

  dispose() {
    this.disposed = true;
    window.removeEventListener("resize", this.onResize);
    window.removeEventListener("mousemove", this.onMouseMove);
    this.scene.children.forEach(child => {
      child.material.dispose();
      child.geometry.dispose();
    });
    if (this.assets.glyphs) this.assets.glyphs.dispose();

    this.hitObjects.forEach(child => {
      if (child) {
        if (child.material) child.material.dispose();
        if (child.geometry) child.geometry.dispose();
      }
    });
    if (this.touchTexture) this.touchTexture.texture.dispose();
    this.scene.dispose();
    this.renderer.dispose();
    this.composer.dispose();
  }

  update() {
    this.touchTexture.update();
    this.subjects.forEach(subject => {
      subject.update();
    });
  }

  render() {
    this.composer.render(this.clock.getDelta());
  }

  tick() {
    if (this.disposed) return;
    this.render();
    this.update();
    requestAnimationFrame(this.tick);
  }

  onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();

    this.composer.setSize(window.innerWidth, window.innerHeight);
    this.subjects.forEach(subject => {
      subject.onResize(window.innerWidth, window.innerHeight);
    });
  }
}

class Loader {
  constructor() {
    this.items = [];
    this.loaded = [];
  }

  begin(name) {
    this.items.push(name);
  }

  end(name) {
    this.loaded.push(name);
    if (this.loaded.length === this.items.length) {
      this.onComplete();
    }
  }

  onComplete() {}
}
