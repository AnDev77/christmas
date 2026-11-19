import { themes, type Seal } from './seals';

export async function saveSealImage(seal: Seal) {
  await document.fonts.ready;
  const artwork = new Image();
  artwork.src = import.meta.env.BASE_URL + 'images/lantern-seal.webp';
  await artwork.decode();

  const canvas = document.createElement('canvas');
  canvas.width = 1080;
  canvas.height = 1350;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas is unavailable.');

  context.fillStyle = '#f4eedf';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.strokeStyle = '#b4a487';
  context.lineWidth = 2;
  context.strokeRect(32, 32, 1016, 1286);
  context.fillStyle = '#64705e';
  context.textAlign = 'center';
  context.font = '24px Georgia, serif';
  context.fillText('WINTER WISHES · 2026', 540, 100);
  context.drawImage(artwork, 175, 150, 730, 665);
  context.fillStyle = themes[seal.theme].color;
  context.font = '28px sans-serif';
  context.fillText(themes[seal.theme].name + '을 담아', 540, 897);
  context.fillStyle = '#283b34';
  context.font = 'bold 60px serif';
  context.fillText(seal.name, 540, 984);
  context.font = '32px sans-serif';
  seal.lines.forEach((line, index) => context.fillText(line, 540, 1060 + index * 53));
  context.font = '26px serif';
  context.fillText('겨울의 행운 ✧', 540, 1242);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((value) => value ? resolve(value) : reject(new Error('PNG export failed.')), 'image/png');
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.download = 'winter-wish-' + seal.id + '.png';
  anchor.href = url;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 60000);
}
