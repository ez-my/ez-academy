export const MAX_PHOTO_BYTES = 500 * 1024 * 1024;
export const MAX_SAVED_PHOTO_BYTES = 1024 * 1024;
export const PHOTO_TYPES = ['image/jpeg','image/png','image/webp'];
export function validatePhoto(file: {size:number;type:string}) {
 if (!file.size || file.size > MAX_PHOTO_BYTES) throw Error('Choose a photo up to 500 MB.');
 if (!PHOTO_TYPES.includes(file.type)) throw Error('Choose a JPG, PNG or WebP photo.');
}
export function devicePhotoKey(uid:string) {
 if (!uid) throw Error('Sign in to save your photo.');
 return `ez-device-photo:v1:${uid}`;
}
export function photoDimensions(width:number,height:number,max=1024) {
 if (!Number.isFinite(width)||!Number.isFinite(height)||width<1||height<1||width*height>64_000_000) throw Error('This photo is too large to process safely. Choose a smaller copy.');
 const scale=Math.min(1,max/Math.max(width,height));return {width:Math.max(1,Math.round(width*scale)),height:Math.max(1,Math.round(height*scale))};
}
