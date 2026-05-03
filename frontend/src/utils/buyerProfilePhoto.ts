const BUYER_PROFILE_PHOTO_KEY_PREFIX = 'buyer-profile-photo';

export function loadBuyerProfilePhoto(userId: number): string {
    return localStorage.getItem(getBuyerProfilePhotoKey(userId)) ?? '';
}

export function saveBuyerProfilePhoto(userId: number, photoUrl: string): void {
    localStorage.setItem(getBuyerProfilePhotoKey(userId), photoUrl);
}

export function removeBuyerProfilePhoto(userId: number): void {
    localStorage.removeItem(getBuyerProfilePhotoKey(userId));
}

function getBuyerProfilePhotoKey(userId: number): string {
    return `${BUYER_PROFILE_PHOTO_KEY_PREFIX}-${userId}`;
}
