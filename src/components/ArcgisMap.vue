<template>
  <div id="mapContainer">
    <div class="option-box">
      <button class="btn" @click.stop="operateRenderer(1)">{{ myRenderer === null ? '显示' : '关闭' }} 第一个</button>
      <button class="btn" @click.stop="operateRenderer(2)">{{ myRendererEr === null ? '显示' : '关闭' }} 第二个</button>
    </div>
  </div>
</template>
<script>
import {loadCss, loadModules} from 'esri-loader';
import points from "@/util/points";
import {threeRender, threeSetup} from "@/util/three";

export default {
  name: 'ArcgisMap',
  data() {
    return {
      gisConstructor: {}, //gis 构造函数
      gisInst: {}, // gis 实例
      view: {},
      gisModules: [
        "esri/Map",
        "esri/views/SceneView",
        "esri/views/3d/externalRenderers",
        'esri/geometry/support/webMercatorUtils',
        "esri/geometry/SpatialReference",
        "esri/geometry/Extent",
        'esri/layers/GraphicsLayer',
        'esri/Graphic',
      ], // gis 模块
      myRenderer: {}, // 第一个场景的渲染器
      myRendererEr: {},// 第二个场景的渲染器
    };
  },
  mounted() {
    this.init();
  },
  methods: {
    init() {
      // 加载模块样式
      loadCss('4.17');
      // 加载模块
      loadModules(this.gisModules, {
        version: '4.17'
      }).then(this.initGisInstance) // 初始化gis实例
        .then(this.initMap) // 初始化地图
        .then(this.initThree1) // 初始化three1
        .then(this.initThree2) // 初始化three2
    },
    // 初始化gis构造函数
    initGisInstance(args) {
      for (let k in args) {
        let name = this.gisModules[k].split('/').pop();
        this.gisConstructor[name] = args[k];
      }
    },
    // 初始化地图
    initMap() {
      // 创建地图实例
      let map = new this.gisConstructor.Map({
        basemap: "satellite",
        ground: 'world-elevation'
      });
      // 创建视图窗口
      this.view = new this.gisConstructor.SceneView({
        container: "mapContainer",
        map: map,
        viewingMode: "local",
        camera: {
          position: [123.7645, 41.828, 8000],
          fov: 55,
          heading: 318.70623732061983,
          tilt: 42.34234113203692,
        }
      });
      // 监听视图窗口点击事件
      this.view.on('click', function (evt) {
        console.log(evt.mapPoint);
      })
      // 添加辅助线
      this.view.graphics.add(new this.gisConstructor.Graphic({
        geometry: {
          type: 'polyline',
          paths: points.path,
        },
        symbol: {
          type: "simple-line", // autocasts as SimpleLineSymbol()
          color: [226, 119, 40],
          width: 2
        }
      }))
      this.view.graphics.add(new this.gisConstructor.Graphic({
        geometry: {
          type: 'polyline',
          paths: points.path2,
        },
        symbol: {
          type: "simple-line", // autocasts as SimpleLineSymbol()
          color: [255, 86, 86],
          width: 2
        }
      }))
    },

    // 初始化three第一个场景
    initThree1() {
      let that = this;
      let view = this.view
      this.myRenderer = {
        view: view,
        renderer: null, // three js 渲染器
        camera: null,    //three js 相机
        scene: null, //three js 场景
        height: 100,
        offest: 0,
        map: null,
        setup: function (context) {
          threeSetup(this, that.gisConstructor, context, view, points.path, 100, 'lineTexture.png');
        },
        render: function (context) {
          threeRender(this, that.gisConstructor, context, view, 0.001)
        }
      }
      // 注册renderer
      that.gisConstructor.externalRenderers.add(view, this.myRenderer);
    },

    initThree2() {
      let that = this;
      let view = this.view
      this.myRendererEr = {
        view: view,
        renderer: null, // three js 渲染器
        camera: null,    //three js 相机
        scene: null, //three js 场景
        height: 100,
        offest: 0,
        map: null,
        setup: function (context) {
          threeSetup(this, that.gisConstructor, context, view, points.path2, 100, 'lineTexture.png', {
            color: 0xff5656,
            radius: 10,
          });
        },
        render: function (context) {
          threeRender(this, that.gisConstructor, context, view, 0.001)
        }
      }
      // 注册renderer
      that.gisConstructor.externalRenderers.add(view, this.myRendererEr);
    },

    operateRenderer(type) {
      if (type === 1) {
        if (this.myRenderer === null) {
          this.initThree1();
        } else {
          // 移除renderer
          this.gisConstructor.externalRenderers.remove(this.view, this.myRenderer);
          // 释放资源
          this.myRenderer = null;
        }
        return false;
      }
      if (type === 2) {
        if (this.myRendererEr === null) {
          this.initThree2();
        } else {
          // 移除renderer
          this.gisConstructor.externalRenderers.remove(this.view, this.myRendererEr);
          // 释放资源
          this.myRendererEr = null;
        }
        return false;
      }
    },

  }
};
</script>

<style lang="less" scoped>
html, body, #mapContainer {
  width: 100vw;
  height: 100vh;
  margin: 0;
  padding: 0;
}

.option-box {
  position: absolute;
  top: 20px;
  left: 80px;
  z-index: 999;
  background: #fff;
  border-radius: 10px;
  padding: 20px;

  .btn {
    margin-left: 20px;
  }

  .btn:first-child {
    margin-left: 0;
  }
}
</style>
