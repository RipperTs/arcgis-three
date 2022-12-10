import * as THREE from "three";

/**
 * 初始化three场景设置
 * @param setup 三维场景对象
 * @param gisConstructor gis构造函数
 * @param context 三维场景上下文
 * @param view 地图视图
 * @param points 点位数据
 * @param zHeight 模型高度
 * @param imgFile 模型纹理图片
 * @param options 扩展参数 {tubularSegments,radius ...}
 */
export const threeSetup = (setup, gisConstructor, context, view, points = [], zHeight = 100, imgFile = 'lineTexture.png', options = {}) => {
  // 初始化渲染器
  setup.renderer = initRenderer(context, view);
  // 初始化场景
  setup.scene = new THREE.Scene();
  // 初始化相机
  setup.camera = new THREE.PerspectiveCamera();
  //添加坐标轴辅助工具
  let axesHelper = new THREE.AxesHelper(10000000);
  setup.scene.add(axesHelper);
  //创建几何体
  let v3List = [];
  // 渲染的点坐标
  points.forEach((item) => {
    var renderPos = [0, 0, 0];
    gisConstructor.externalRenderers.toRenderCoordinates(setup.view,
      [item[0], item[1], zHeight], // 高度调整
      0,
      gisConstructor.SpatialReference.WGS84,
      renderPos,
      0,
      1
    );
    v3List.push(new THREE.Vector3(renderPos[0], renderPos[1], renderPos[2]));
  })
  let curve = new THREE.CatmullRomCurve3(v3List, false);
  let tubeGeometry = new THREE.TubeGeometry(curve, options.tubularSegments || 500, options.radius || 100, 8, false);
  var textureLoader = new THREE.TextureLoader();
  //设置纹理贴图
  setup.map = textureLoader.load(require('@/assets/' + imgFile));
  setup.map.wrapS = THREE.RepeatWrapping;
  setup.map.wrapT = THREE.RepeatWrapping;

  setup.map.repeat.set(20, 4);

  let material = new THREE.MeshBasicMaterial({
    color: 0x85A9A9,
    side: 200,
    map: setup.map,
    transparent: true,
    depthWrite: false,
    opacity: 1,
  });
  let tube1 = new THREE.Mesh(tubeGeometry, material);
  setup.scene.add(tube1);

  let tubeGeometry2 = new THREE.TubeGeometry(curve, 100, 0.2);
  let tubeMaterial2 = new THREE.MeshPhongMaterial({
    color: 0xaaaaaa,
    transparent: true,
    opacity: 0.25,
  });
  let tube2 = new THREE.Mesh(tubeGeometry2, tubeMaterial2);
  setup.scene.add(tube2);

  var ambient = new THREE.AmbientLight(0xffffff, 1);
  ambient.position.set(0, 100, 0);
  setup.scene.add(ambient);

  context.resetWebGLState();
}

/**
 * 初始化渲染器
 * @param context
 * @param view
 * @returns {WebGLRenderer}
 */
export const initRenderer = (context, view) => {
  let renderer = new THREE.WebGLRenderer({
    context: context.gl,
    premultipliedAlpha: false,   //renderer 是否假设颜色有 premaultiplied alpha 默认为true
  });
  renderer.setPixelRatio(window.devicePixelRatio); //设置设备像素比。通常用于避免HiDPI设备上绘图模糊
  renderer.setViewport(0, 0, view.width, view.height);//视图大小设置
  //防止three.js 清除Arcgis JS API 提供的缓冲区
  renderer.autoClearDepth = false; // 定义renderer是否清除深度缓存
  renderer.autoClearStencil = false; // 定义renderer是否清除模板缓存
  renderer.autoClearColor = false; // 定义renderer是否清除颜色缓存
  return renderer;
}

/**
 * 渲染three场景
 * @param render  渲染函数
 * @param gisConstructor  gis构造函数
 * @param context 三维场景上下文
 * @param view  地图视图
 * @param speed 速度
 */
export const threeRender = (render, gisConstructor, context, view, speed = 0.001) => {
// 更新相机参数
  let cam = context.camera;
  render.camera.position.set(cam.eye[0], cam.eye[1], cam.eye[2]);
  render.camera.up.set(cam.up[0], cam.up[1], cam.up[2]);
  render.camera.lookAt(
    new THREE.Vector3(cam.center[0], cam.center[1], cam.center[2])
  );
  // 投影矩阵可以直接复制
  render.camera.projectionMatrix.fromArray(cam.projectionMatrix);
  // // 更新几何体
  if (render.map) {
    render.map.offset.x += speed;
    render.map.needsUpdate = true;
  }
  // 绘制场景
  render.renderer.state.reset();
  // 解决无法加载模型的问题
  context.bindRenderTarget();
  render.renderer.render(render.scene, render.camera);
  // 请求重绘视图。
  gisConstructor.externalRenderers.requestRender(view);
  // cleanup
  context.resetWebGLState();
}

export default {
  threeSetup,
  threeRender
}
