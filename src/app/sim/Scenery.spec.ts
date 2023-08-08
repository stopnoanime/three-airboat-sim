import { Scenery } from './Scenery';
import * as THREE from 'three';
import * as PLANCK from 'planck';
import { GLTF } from 'three/examples/jsm/loaders/GLTFLoader';

describe('Scenery', () => {
  let world: PLANCK.World;
  let svg: Document;
  let canvas: HTMLCanvasElement;
  let heightMap: THREE.Texture;
  let scenery: Scenery;

  beforeEach(() => {
    world = new PLANCK.World();

    svg = new DOMParser().parseFromString(
      `
      <svg viewBox="0 0 1 1">
        <circle cx="0" cy="0" data-object="obj_1" />
        <circle cx="0.25" cy="0.75" data-object="obj_2" />
        <circle cx="0.75" cy="0.99" data-object="obj_2" />
        <path d="M 0.25 0.25 l 0.5 0 l 0 0.5 l -0.5 0 l 0 -0.5"/>
      </svg>
      `,
      'text/html',
    );

    canvas = document.createElement('canvas');
    canvas.width = 2;
    canvas.height = 2;

    // prettier-ignore
    canvas
      .getContext('2d')!
      .putImageData(
        new ImageData(
          new Uint8ClampedArray([
            0, 0, 0, 255, 85, 85, 85, 255, 170, 170, 170, 255, 255, 255, 255, 255,
          ]), 
          2, 2, 
        ),
        0, 0, 
      );

    heightMap = new THREE.Texture(canvas);

    scenery = new Scenery(world, svg, heightMap);
  });

  it('should be created', () => {
    expect(scenery).toBeTruthy();
  });

  it('should create map walls', () => {
    const body = world.getBodyList();
    expect(body).toBeTruthy();

    const fixture = body!.getFixtureList();
    expect(fixture).toBeTruthy();

    const shape = fixture!.getShape() as PLANCK.Chain;
    const count = shape.getChildCount();

    expect(count % 4)
      .withContext(
        `convertSvgPathsToMapWalls's segment count needs to be divisible by 4 for this test to work`,
      )
      .toBe(0);

    const tl = shape.getVertex(0);
    const tr = shape.getVertex(count / 4);
    const br = shape.getVertex(count / 2);
    const bl = shape.getVertex((count * 3) / 4);

    expect(tl.x).toBe(-0.25 * scenery.size);
    expect(tl.y).toBe(0.25 * scenery.size);

    expect(tr.x).toBe(0.25 * scenery.size);
    expect(tr.y).toBe(0.25 * scenery.size);

    expect(br.x).toBe(0.25 * scenery.size);
    expect(br.y).toBe(-0.25 * scenery.size);

    expect(bl.x).toBe(-0.25 * scenery.size);
    expect(bl.y).toBe(-0.25 * scenery.size);
  });

  it('should place meshes', () => {
    const meshMap = new Map([
      ['obj_1', createMockGLTF('obj_1')],
      ['obj_2', createMockGLTF('obj_2')],
    ]);
    scenery.placeMeshes(svg, heightMap, meshMap);

    expect(scenery.children.length).toBe(2);

    const obj_1 = scenery.getObjectByName('obj_1') as THREE.InstancedMesh;
    const obj_2 = scenery.getObjectByName('obj_2') as THREE.InstancedMesh;

    expect(obj_1).toBeTruthy();
    expect(obj_2).toBeTruthy();

    expect(obj_1.count).toBe(1);
    expect(obj_2.count).toBe(2);

    const matrix = new THREE.Matrix4();

    obj_1.getMatrixAt(0, matrix);
    verifyMatrix4(matrix, 0, 0, 0);

    obj_2.getMatrixAt(0, matrix);
    verifyMatrix4(matrix, 0.25, 0.75, 170);
    obj_2.getMatrixAt(1, matrix);
    verifyMatrix4(matrix, 0.75, 0.99, 255);
  });

  function verifyMatrix4(
    matrix: THREE.Matrix4,
    x: number,
    z: number,
    y: number,
  ) {
    const vec = new THREE.Vector3().setFromMatrixPosition(matrix);
    expect(vec.x).toBe((x - 1 / 2) * scenery.size);
    expect(vec.z).toBe((z - 1 / 2) * scenery.size);
    expect(vec.y).toBeCloseTo(y / 255 - scenery.heightMapOffset - 0.05, 4);
  }

  function createMockGLTF(name: string) {
    const mesh = new THREE.Mesh();
    mesh.name = name;

    return {
      scene: {
        children: [mesh],
      },
    } as any as GLTF;
  }
});
