/**
 * Asset Manager for EduLand Builder Jump
 * Loads high-fidelity 2D/3D diorama sprites and panoramic backdrops.
 * Automatically processes white-background sprites into transparent sprites with edge anti-aliasing.
 */

export interface GameAssets {
  isLoaded: boolean;
  backdropImg: HTMLImageElement | null;
  paigeRunCanvas: HTMLCanvasElement | null;
  paigeGlideCanvas: HTMLCanvasElement | null;
  goldenBookCanvas: HTMLCanvasElement | null;
  bookwormCanvas: HTMLCanvasElement | null;
}

const ASSET_PATHS = {
  paigeRun: '/src/assets/images/paige_sprite_run_1791174716732.jpg',
  paigeGlide: '/src/assets/images/paige_sprite_glide_1791174732914.jpg',
  backdrop: '/src/assets/images/diorama_backdrop_panoramic_1791174745909.jpg',
  goldenBook: '/src/assets/images/golden_book_item_1791174757347.jpg',
  bookworm: '/src/assets/images/bookworm_enemy_sprite_1791174775271.jpg',
};

class AssetManager {
  private assets: GameAssets = {
    isLoaded: false,
    backdropImg: null,
    paigeRunCanvas: null,
    paigeGlideCanvas: null,
    goldenBookCanvas: null,
    bookwormCanvas: null,
  };

  private loadPromise: Promise<GameAssets> | null = null;

  public loadAll(): Promise<GameAssets> {
    if (this.loadPromise) return this.loadPromise;

    this.loadPromise = new Promise(async (resolve) => {
      try {
        const [backdropImg, paigeRunImg, paigeGlideImg, goldenBookImg, bookwormImg] =
          await Promise.all([
            this.loadImage(ASSET_PATHS.backdrop),
            this.loadImage(ASSET_PATHS.paigeRun),
            this.loadImage(ASSET_PATHS.paigeGlide),
            this.loadImage(ASSET_PATHS.goldenBook),
            this.loadImage(ASSET_PATHS.bookworm),
          ]);

        this.assets.backdropImg = backdropImg;
        this.assets.paigeRunCanvas = this.makeTransparent(paigeRunImg, 228);
        this.assets.paigeGlideCanvas = this.makeTransparent(paigeGlideImg, 228);
        this.assets.goldenBookCanvas = this.makeTransparent(goldenBookImg, 230);
        this.assets.bookwormCanvas = this.makeTransparent(bookwormImg, 225);
        this.assets.isLoaded = true;

        resolve(this.assets);
      } catch (err) {
        console.warn('Failed to load some game assets, fallback rendering will be used:', err);
        this.assets.isLoaded = true;
        resolve(this.assets);
      }
    });

    return this.loadPromise;
  }

  public getAssets(): GameAssets {
    return this.assets;
  }

  private loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = (e) => reject(e);
      img.src = src;
    });
  }

  /**
   * Converts white background to clean transparent alpha channel with soft anti-aliased edge
   */
  private makeTransparent(img: HTMLImageElement, threshold = 230): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return canvas;

    ctx.drawImage(img, 0, 0);
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      // If near white, feather alpha
      if (r > threshold && g > threshold && b > threshold) {
        const brightness = (r + g + b) / 3;
        if (brightness > threshold + 12) {
          data[i + 3] = 0; // pure transparent
        } else {
          // soft feather boundary
          const factor = (255 - brightness) / 12;
          data[i + 3] = Math.max(0, Math.min(255, Math.round(data[i + 3] * factor)));
        }
      }
    }

    ctx.putImageData(imgData, 0, 0);
    return canvas;
  }
}

export const assetManager = new AssetManager();
