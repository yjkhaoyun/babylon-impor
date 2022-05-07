import React from "react";
import * as BABYLON from "@babylonjs/core";
import SceneComponent from "babylonjs-hook";
import "@babylonjs/loaders/glTF/2.0/glTFLoader";
import "@babylonjs/loaders";
import "../App.css";

function BabylonScene() {
  const [FPS, setFPS] = React.useState(0);
  let ground;
  let skull;
  let SPS;
  let count = 0;

  const onSceneReady = (scene) => {
    var camera = new BABYLON.ArcRotateCamera(
      "Camera",
      0,
      1,
      15,
      new BABYLON.Vector3.Zero(),
      scene
    );
    camera.lowerBetaLimit = (Math.PI / 2) * 0.1;
    camera.upperBetaLimit = (Math.PI / 2) * 0.99;
    camera.lowerRadiusLimit = 10;
    camera.upperRadiusLimit = 150;

    const canvas = scene.getEngine().getRenderingCanvas();
    camera.attachControl(canvas, true);
    camera.position = new BABYLON.Vector3(0, 30, -30);

    var light = new BABYLON.SpotLight(
      "*spot00",
      new BABYLON.Vector3(50, 50, 0),
      new BABYLON.Vector3(-1, -1, 0),
      5,
      30,
      scene
    );
    light.intensity = 0.9;
    var light1 = new BABYLON.HemisphericLight(
      "light",
      new BABYLON.Vector3(0, 1, 0),
      scene
    );
    light1.position = new BABYLON.Vector3(0, 50, 0);
    light1.intensity = 0.6;

    // Skybox
    var skybox = BABYLON.Mesh.CreateBox("skyBox", 5000.0, scene);
    var skyboxMaterial = new BABYLON.StandardMaterial("skyBox", scene);
    skyboxMaterial.backFaceCulling = false;
    skyboxMaterial.reflectionTexture = new BABYLON.CubeTexture(
      "//www.babylonjs.com/assets/skybox/TropicalSunnyDay",
      scene
    );
    skyboxMaterial.reflectionTexture.coordinatesMode =
      BABYLON.Texture.SKYBOX_MODE;
    skyboxMaterial.diffuseColor = new BABYLON.Color3(0, 0, 0);
    skyboxMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
    skyboxMaterial.disableLighting = true;
    skybox.material = skyboxMaterial;

    ground = BABYLON.MeshBuilder.CreateGround(
      "ground",
      { width: 500, height: 500 },
      scene,
      false
    );
    ground.material = new BABYLON.StandardMaterial("materialGround", scene);
    ground.material.diffuseTexture = new BABYLON.Texture(
      "./textures/grass.png",
      scene
    );
    ground.material.alpha = 1;
    ground.receiveShadows = true;
    ground.material.specularColor = new BABYLON.Color3(0, 0, 0);

    // light.includedOnlyMeshes.push(box);
    light.includedOnlyMeshes.push(ground);

    var shadowGenerator = new BABYLON.ShadowGenerator(512, light);
    // shadowGenerator.getShadowMap().renderList.push(box);
    shadowGenerator.useBlurExponentialShadowMap = true;
    shadowGenerator.blurBoxOffset = 2.0;

    // BABYLON.SceneLoader.ImportMesh(
    //   "",
    //   "./scenes/",
    //   "L-159.gltf",
    //   scene,
    //   function (meshes) {
    //     skull = meshes;
    //     camera.target = skull;
    //     skull.position = new BABYLON.Vector3(-20, 5, 0);
    //     skull.scaling = new BABYLON.Vector3(10, 10, 10);
    //     light.includedOnlyMeshes.push(skull);
    //     shadowGenerator.getShadowMap().renderList.push(skull);
    //   }
    // );
    BABYLON.SceneLoader.Append("scenes/", "CannonStorm3.glb", scene);

    //     BABYLON.SceneLoader.ImportMesh("ufo", "./scenes", "ufo.obj", scene, function(object) {
    //       // You can apply properties to object.
    //       object.scaling = new BABYLON.Vector3(0.09, 0.09, 0.09);
    // });

    //   BABYLON.SceneLoader.LoadAssetContainer("./scenes", "uploads_files_1969587_Cactus1.gltf.gltf", scene, function (container) {
    //     var meshes = container.meshes;
    //     var materials = container.materials;
    //     //...

    //     // Adds all elements to the scene
    //     container.addAllToScene();
    // });

    // BABYLON.SceneLoader.ImportMesh(
    //   "",
    //   "https://models.babylonjs.com/Marble/marble/",
    //   "marble.gltf",
    //   scene,
    //   function (m) {
    //     console.log(m);
    //   }
    // );

    // Particle system
    var particleNb = 1;
    SPS = new BABYLON.SolidParticleSystem("SPS", scene, {
      particleIntersection: true
    });
    var sphereP = BABYLON.Mesh.CreateSphere("sphere", 10, 2, scene);
    SPS.addShape(sphereP, particleNb);
    sphereP.dispose();
    var mesh = SPS.buildMesh();
    mesh.hasVertexAlpha = true;
    SPS.isAlwaysVisible = true;
    SPS.computeParticleTexture = false;

    // position things
    mesh.position = new BABYLON.Vector3(-20, 5, 0);

    // shared variables
    var speed = 30; // particle max speed
    var gravity = -10; // gravity
    var restitution = 0.75; // energy restitution
    var bboxesComputed = false; // the bbox are actually computed only after the first particle.update()

    // SPS initialization : just recycle all
    SPS.initParticles = function () {
      for (var p = 0; p < SPS.nbParticles; p++) {
        SPS.recycleParticle(SPS.particles[p]);
      }
    };

    // recycle : reset the particle at the emitter origin
    SPS.recycleParticle = function (particle) {
      particle.position = new BABYLON.Vector3(0, 0, 0);
      particle.velocity.x = (Math.random() - 0.5) * speed;
      particle.velocity.z = (Math.random() - 0.5) * speed;
      particle.velocity.y = Math.random() * speed;

      particle.color.r = 0;
      particle.color.g = 0;
      particle.color.b = 0;
      particle.color.a = 1.0;
    };

    // particle behavior
    SPS.updateParticle = function (particle) {
      var deltaTimeIn = scene.getEngine().getDeltaTime() / 1000;
      deltaTimeIn = 0.016 * 4;
      // recycle if touched the ground
      if (particle.position.y < 1 && count >= 4) {
        particle.velocity.y = 0;
        particle.velocity.x = particle.velocity.x * restitution;
        particle.velocity.z = particle.velocity.z * restitution;
        particle.position.addInPlace(
          particle.velocity.multiplyByFloats(
            deltaTimeIn,
            deltaTimeIn,
            deltaTimeIn
          )
        ); // update particle new position
        particle.color.a -= 0.05;
        if (particle.color.a < 0) {
          this.recycleParticle(particle);
          count = 0;
        }
        return;
      }

      particle.velocity.addInPlace(
        new BABYLON.Vector3(0, gravity, 0).multiplyByFloats(0, deltaTimeIn, 0)
      ); // apply gravity to y
      particle.position.addInPlace(
        particle.velocity.multiplyByFloats(
          deltaTimeIn,
          deltaTimeIn,
          deltaTimeIn
        )
      ); // update particle new position

      // intersection
      if (
        bboxesComputed &&
        (particle.intersectsMesh(ground) || particle.position.y < 1) &&
        particle.velocity.y < 0
      ) {
        particle.velocity.y = -particle.velocity.y;
        particle.velocity.scaleInPlace(restitution); // aply restitution
        count++;
      }
    };

    SPS.afterUpdateParticles = function () {
      bboxesComputed = true;
    };

    SPS.initParticles();
  };

  /**
   * Will run on every frame render.  We are spinning the skull on y-axis.
   */
  const onRender = (scene) => {
    setFPS(() => scene.getEngine().getFps().toFixed() + " fps");
    SPS.setParticles();
  };

  return (
    <div id="scene">
      <h1 id="fps">{FPS}</h1>
      <SceneComponent
        antialias
        onSceneReady={onSceneReady}
        onRender={onRender}
        id="my-canvas"
      />
    </div>
  );
}

export default BabylonScene;
