import * as THREE from 'three';
import * as PLANCK from 'planck';
import { GLTF } from 'three/examples/jsm/loaders/GLTFLoader';

export class Scenery extends THREE.Mesh {
  public sandColor = 0xf2d2a9;
  public grassColor = 0x009a17;
  public heightMapOffset = 0.5;
  public grassHeight = 0.6;

  override material: THREE.ShaderMaterial;

  public size: number;

  private body: PLANCK.Body;

  constructor(
    world: PLANCK.World,
    mapSvg: Document,
    heightMap: THREE.Texture,
    size = 100,
  ) {
    super();

    this.size = size;

    // THREE
    this.material = new THREE.ShaderMaterial({
      uniforms: {
        heightMap: { value: heightMap },
        heightMapOffset: { value: this.heightMapOffset },
        grassHeight: { value: this.grassHeight },
        sandColor: { value: new THREE.Color(this.sandColor) },
        grassColor: { value: new THREE.Color(this.grassColor) },
      },
      vertexShader: terrainVertexShader,
      fragmentShader: terrainFragmentShader,
    });

    this.geometry = new THREE.PlaneGeometry(
      size,
      size,
      size - 1,
      size - 1,
    ).rotateX(-Math.PI / 2);

    // PLANCK
    this.body = world.createBody();
    this.convertSvgPathsToMapWalls(mapSvg).forEach((wall) =>
      this.body.createFixture({
        shape: wall,
      }),
    );
  }

  public placeMeshes(
    svg: Document,
    heightMap: THREE.Texture,
    meshMap: Map<string, GLTF>,
  ) {
    const elements = [...svg.getElementsByTagName('circle')].map((e) => ({
      x: Number(e.getAttribute('cx')),
      y: Number(e.getAttribute('cy')),
      type: e.dataset['object'] as string,
    }));

    //needed for instancedMesh count
    const elementOccurrences = elements.reduce(
      (acc, el) => (acc[el.type] ? acc[el.type]++ : (acc[el.type] = 1), acc),
      {} as { [index: string]: number },
    );

    const instancedMeshMap = new Map(
      Object.entries(elementOccurrences).map(([element, count]) => {
        const gltf = meshMap.get(element)!;
        const mesh = gltf.scene.children[0] as THREE.Mesh;

        const iMesh = new THREE.InstancedMesh(
          mesh.geometry,
          mesh.material,
          count,
        );
        iMesh.userData['idx'] = 0;
        iMesh.name = mesh.name;

        this.add(iMesh);

        return [element, iMesh];
      }),
    );

    const imageData = this.convertTextureToImageData(heightMap);

    for (const element of elements) {
      const posX = (element.x - 1 / 2) * this.size;
      const posZ = (element.y - 1 / 2) * this.size;

      const imageIdx =
        Math.floor(element.y * imageData.height) * imageData.width +
        Math.floor(element.x * imageData.width);
      const posY =
        imageData.data[imageIdx * 4] / 255 - this.heightMapOffset - 0.05;

      const matrix = new THREE.Matrix4().compose(
        new THREE.Vector3(posX, posY, posZ),
        new THREE.Quaternion().setFromAxisAngle(
          new THREE.Vector3(0, 1, 0),
          Math.random() * Math.PI * 2,
        ),
        new THREE.Vector3(0.75, 0.75, 0.75),
      );

      const iMesh = instancedMeshMap.get(element.type)!;
      iMesh.setMatrixAt(iMesh.userData['idx']++, matrix);
    }
  }

  private convertSvgPathsToMapWalls(svg: Document, segments = 200) {
    return [...svg.getElementsByTagName('path')].map((path) => {
      const points: PLANCK.Vec2[] = [];
      const length = path.getTotalLength();

      for (let i = 0; i < segments; i++) {
        var pt = path.getPointAtLength((i * length) / segments);
        points.push(
          PLANCK.Vec2((pt.x - 1 / 2) * this.size, (1 / 2 - pt.y) * this.size),
        );
      }

      return PLANCK.Chain(points, true);
    });
  }

  private convertTextureToImageData(texture: THREE.Texture) {
    const canvas = document.createElement('canvas');
    canvas.width = texture.image.width;
    canvas.height = texture.image.height;

    const canvasContext = canvas.getContext('2d')!;
    canvasContext.drawImage(texture.image, 0, 0);

    return canvasContext.getImageData(
      0,
      0,
      texture.image.width,
      texture.image.height,
    );
  }
}

// Inspired by https://www.youtube.com/watch?app=desktop&v=G0hWjD0n46c

const terrainVertexShader = `
    uniform sampler2D heightMap;
    uniform float heightMapOffset;

    varying float vertexHeight;

    void main() {
        vertexHeight = texture2D(heightMap, uv).r;

        vec3 newPosition = position + normal * (vertexHeight - heightMapOffset);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
    }
`;

const terrainFragmentShader = `
    uniform vec3 sandColor;
    uniform vec3 grassColor;
    uniform float grassHeight;

    varying float vertexHeight;

    void main() {
        vec3 sand = (1.0 - smoothstep(grassHeight, grassHeight + 0.2, vertexHeight)) * sandColor;
        vec3 grass = smoothstep(grassHeight, grassHeight + 0.2, vertexHeight) * grassColor;

        gl_FragColor = vec4(sand + grass, 1.0);
    }
`;
