/**
 * Utilitário de compressão de imagens no cliente (navegador).
 * Reduz fotos de câmeras de celular de 5-10 MB para ~150-300 KB
 * mantendo alta legibilidade de códigos de barras, textos e comprovantes bancários.
 */

export async function compressImageIfNeeded(file, options = {}) {
  // Apenas arquivos de imagem são processados. PDFs e outros formatos são mantidos intactos.
  if (!file || !file.type || !file.type.startsWith('image/')) {
    return file;
  }

  // Se a imagem já for menor que 300 KB, não precisa reprocessar
  if (file.size <= 300 * 1024) {
    return file;
  }

  const maxWidth = options.maxWidth || 1920;
  const maxHeight = options.maxHeight || 1920;
  const quality = options.quality || 0.82;
  const targetMime = file.type === 'image/webp' ? 'image/webp' : 'image/jpeg';

  return new Promise((resolve) => {
    try {
      const reader = new FileReader();

      reader.onerror = () => {
        console.warn('Falha ao ler imagem para compressão, enviando original');
        resolve(file);
      };

      reader.onload = (e) => {
        const img = new Image();

        img.onerror = () => {
          console.warn('Falha ao instanciar imagem, enviando original');
          resolve(file);
        };

        img.onload = () => {
          try {
            let width = img.width;
            let height = img.height;

            // Redimensionamento proporcional se exceder as dimensões máximas
            if (width > maxWidth || height > maxHeight) {
              const ratio = Math.min(maxWidth / width, maxHeight / height);
              width = Math.round(width * ratio);
              height = Math.round(height * ratio);
            }

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext('2d');
            if (!ctx) {
              resolve(file);
              return;
            }

            // Fundo branco caso haja transparência em PNG
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, width, height);

            ctx.drawImage(img, 0, 0, width, height);

            canvas.toBlob(
              (blob) => {
                if (!blob || blob.size >= file.size) {
                  // Se a compressão não diminuiu o tamanho, usa o original
                  resolve(file);
                  return;
                }

                // Cria um novo arquivo File com a extensão adequada
                const originalName = file.name || 'foto_comprovante.jpg';
                const baseName = originalName.substring(0, originalName.lastIndexOf('.')) || originalName;
                const extension = targetMime === 'image/webp' ? 'webp' : 'jpg';
                const newFileName = `${baseName}.${extension}`;

                const compressedFile = new File([blob], newFileName, {
                  type: targetMime,
                  lastModified: Date.now()
                });

                const savedPercent = Math.round((1 - compressedFile.size / file.size) * 100);
                console.info(
                  `📸 Foto otimizada: ${(file.size / 1024 / 1024).toFixed(2)} MB ➔ ${(compressedFile.size / 1024).toFixed(0)} KB (-${savedPercent}%)`
                );

                resolve(compressedFile);
              },
              targetMime,
              quality
            );
          } catch (canvasErr) {
            console.warn('Erro durante renderização no canvas:', canvasErr);
            resolve(file);
          }
        };

        img.src = e.target.result;
      };

      reader.readAsDataURL(file);
    } catch (err) {
      console.warn('Erro ao comprimir imagem:', err);
      resolve(file);
    }
  });
}
