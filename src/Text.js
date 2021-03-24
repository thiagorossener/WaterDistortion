import * as THREE from "three";

global.THREE = THREE;
const createGeometry = require("three-bmfont-text");
const loadFont = require("load-bmfont");

const font = require("./static/TomChalky-BobbyJonesRegular.json");
const GlyphURL = require("./static/TomChalky-BobbyJonesRegular.png");
const MSDFShader = require("three-bmfont-text/shaders/msdf");
export const loadTextAssets = (assets, loader) => {
  assets.font = font;
  loader.begin("glyphs");
  var glyphsLoader = new THREE.TextureLoader();
  glyphsLoader.crossOrigin = "";
  glyphsLoader.load(GlyphURL, glyphs => {
    assets.glyphs = glyphs;
    loader.end("glyphs");
  });
};

export const createTextMaterial = (glyphs, options = {}) => {
  const mdsf = MSDFShader({
    transparent: true,
    side: THREE.DoubleSide,
    map: glyphs,
    color: "rgb(0,0,0)",
    negate: false,
    ...options
  });
  const material = new THREE.RawShaderMaterial({ ...mdsf });
  return material;
};

export class Text {
  constructor(sceneManager) {
    this.sceneManager = sceneManager;
    this.glyphs = null;
    this.font = font;

    this.mesh = null;
  }

  load(loader) {
    loader.begin("glyphs");
    var glyphsLoader = new THREE.TextureLoader();
    glyphsLoader.crossOrigin = "";
    glyphsLoader.load(GlyphURL, glyphs => {
      this.glyphs = glyphs;
      loader.end("glyphs");
    });
  }

  init() {
    const geometry = createGeometry({
      font: this.font,
      align: "center",
      text: "ABSOLUTELYMENTAL"
    });
    const material = createTextMaterial(this.glyphs);
    const mesh = new THREE.Mesh(geometry, material);
    this.mesh = mesh;
    this.resizeText();
    this.sceneManager.scene.add(mesh);
  }

  update() {}

  resizeText(width) {
    let scale = 0.1;
    if (window.innerWidth >= 800) {
      scale = 0.2;
    }
    if (window.innerWidth >= 1200) {
      scale = 0.3;
      scale = 0.42;
    }
    const mesh = this.mesh;
    const layout = mesh.geometry.layout;
    mesh.scale.x = scale;
    mesh.scale.y = -scale;
    mesh.position.x = (-layout.width / 2) * scale;
    // mesh.position.y = (-layout.xHeight / 2) * scale;
    mesh.position.y = (-layout.height / 2 + 5) * scale;
  }
  onResize(width, height) {
    this.resizeText(width);
  }
}
