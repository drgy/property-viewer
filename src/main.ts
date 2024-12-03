import * as three from 'three';

const canvas = document.querySelector('canvas')!;
const renderer = new three.WebGLRenderer({ antialias: true, canvas });
const camera = new three.PerspectiveCamera(75, 2, 0.1, 5);
camera.position.z = 2;

const resize_observer = new ResizeObserver(() => {
    renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
    camera.aspect = canvas.clientWidth / canvas.clientHeight;
    camera.updateProjectionMatrix();
});
resize_observer.observe(canvas);

const scene = new three.Scene();

const cube = new three.Mesh(new three.BoxGeometry(1, 1, 1), new three.MeshPhongMaterial({ color: 0x2222aa }));
scene.add(cube);

const light = new three.DirectionalLight(0xffffff, 3);
light.position.set(-1, 2, 4);
scene.add(light);

function render() {
    renderer.render(scene, camera);
    requestAnimationFrame(render);
}

requestAnimationFrame(render);