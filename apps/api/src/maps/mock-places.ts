import { PlaceDto } from './place.dto';

/**
 * ⚠️ DỮ LIỆU MOCK — danh sách địa điểm cố định (tọa độ gần đúng) để demo khi chưa tích hợp
 * dịch vụ bản đồ/geocoding thật. Không dùng cho sản xuất.
 */
export const MOCK_PLACES: PlaceDto[] = [
  // Hà Nội
  { id: 'hn-hoan-kiem', name: 'Hồ Hoàn Kiếm', address: 'Hồ Hoàn Kiếm, Hoàn Kiếm, Hà Nội', province: 'Hà Nội', lat: 21.0285, lng: 105.8542 },
  { id: 'hn-my-dinh', name: 'Bến xe Mỹ Đình', address: '20 Phạm Hùng, Nam Từ Liêm, Hà Nội', province: 'Hà Nội', lat: 21.0287, lng: 105.7784 },
  { id: 'hn-giap-bat', name: 'Bến xe Giáp Bát', address: 'Giải Phóng, Hoàng Mai, Hà Nội', province: 'Hà Nội', lat: 20.9806, lng: 105.8411 },
  { id: 'hn-gia-lam', name: 'Bến xe Gia Lâm', address: '9 Ngô Gia Khảm, Long Biên, Hà Nội', province: 'Hà Nội', lat: 21.0485, lng: 105.8784 },
  { id: 'hn-noi-bai', name: 'Sân bay Nội Bài', address: 'Sóc Sơn, Hà Nội', province: 'Hà Nội', lat: 21.2187, lng: 105.8042 },
  { id: 'hn-ha-dong', name: 'Hà Đông', address: 'Quang Trung, Hà Đông, Hà Nội', province: 'Hà Nội', lat: 20.9714, lng: 105.7788 },
  // Đồng bằng Bắc Bộ
  { id: 'hy-pho-noi', name: 'Phố Nối', address: 'Phố Nối, Mỹ Hào, Hưng Yên', province: 'Hưng Yên', lat: 20.9337, lng: 106.0628 },
  { id: 'hd-trung-tam', name: 'TP Hải Dương', address: 'Trung tâm TP Hải Dương', province: 'Hải Dương', lat: 20.9373, lng: 106.3146 },
  { id: 'hp-trung-tam', name: 'Trung tâm Hải Phòng', address: 'Nhà hát lớn, Hồng Bàng, Hải Phòng', province: 'Hải Phòng', lat: 20.8566, lng: 106.6829 },
  { id: 'hp-niem-nghia', name: 'Bến xe Niệm Nghĩa', address: 'Trần Nguyên Hãn, Lê Chân, Hải Phòng', province: 'Hải Phòng', lat: 20.8358, lng: 106.6770 },
  { id: 'qn-ha-long', name: 'TP Hạ Long', address: 'Bãi Cháy, Hạ Long, Quảng Ninh', province: 'Quảng Ninh', lat: 20.9517, lng: 107.08 },
  { id: 'bn-trung-tam', name: 'TP Bắc Ninh', address: 'Trung tâm TP Bắc Ninh', province: 'Bắc Ninh', lat: 21.1861, lng: 106.0763 },
  { id: 'hnam-phu-ly', name: 'TP Phủ Lý', address: 'Trung tâm TP Phủ Lý, Hà Nam', province: 'Hà Nam', lat: 20.5411, lng: 105.9139 },
  { id: 'nd-trung-tam', name: 'TP Nam Định', address: 'Trung tâm TP Nam Định', province: 'Nam Định', lat: 20.42, lng: 106.1683 },
  { id: 'nb-trung-tam', name: 'TP Ninh Bình', address: 'Trung tâm TP Ninh Bình', province: 'Ninh Bình', lat: 20.2506, lng: 105.9745 },
  { id: 'tb-trung-tam', name: 'TP Thái Bình', address: 'Trung tâm TP Thái Bình', province: 'Thái Bình', lat: 20.4463, lng: 106.3366 },
  { id: 'tn-trung-tam', name: 'TP Thái Nguyên', address: 'Trung tâm TP Thái Nguyên', province: 'Thái Nguyên', lat: 21.5942, lng: 105.8482 },
  // TP.HCM & lân cận
  { id: 'hcm-ben-thanh', name: 'Chợ Bến Thành', address: 'Lê Lợi, Quận 1, TP.HCM', province: 'TP.HCM', lat: 10.7725, lng: 106.698 },
  { id: 'hcm-tan-son-nhat', name: 'Sân bay Tân Sơn Nhất', address: 'Tân Bình, TP.HCM', province: 'TP.HCM', lat: 10.8185, lng: 106.6588 },
  { id: 'hcm-mien-tay', name: 'Bến xe Miền Tây', address: 'Kinh Dương Vương, Bình Tân, TP.HCM', province: 'TP.HCM', lat: 10.7404, lng: 106.6189 },
  { id: 'hcm-mien-dong', name: 'Bến xe Miền Đông mới', address: 'Xa lộ Hà Nội, TP Thủ Đức, TP.HCM', province: 'TP.HCM', lat: 10.879, lng: 106.816 },
  { id: 'hcm-thu-duc', name: 'Thủ Đức', address: 'Võ Văn Ngân, TP Thủ Đức, TP.HCM', province: 'TP.HCM', lat: 10.8494, lng: 106.7537 },
  { id: 'dn-bien-hoa', name: 'TP Biên Hòa', address: 'Trung tâm TP Biên Hòa, Đồng Nai', province: 'Đồng Nai', lat: 10.9574, lng: 106.8427 },
  { id: 'dn-long-thanh', name: 'Long Thành', address: 'Long Thành, Đồng Nai', province: 'Đồng Nai', lat: 10.7806, lng: 106.951 },
  { id: 'brvt-ba-ria', name: 'TP Bà Rịa', address: 'Trung tâm TP Bà Rịa', province: 'Bà Rịa - Vũng Tàu', lat: 10.4963, lng: 107.1684 },
  { id: 'brvt-vung-tau', name: 'TP Vũng Tàu', address: 'Bãi Trước, Vũng Tàu', province: 'Bà Rịa - Vũng Tàu', lat: 10.346, lng: 107.0843 },
  { id: 'bd-thu-dau-mot', name: 'TP Thủ Dầu Một', address: 'Trung tâm TP Thủ Dầu Một, Bình Dương', province: 'Bình Dương', lat: 10.9804, lng: 106.6519 },
  { id: 'tg-my-tho', name: 'TP Mỹ Tho', address: 'Trung tâm TP Mỹ Tho, Tiền Giang', province: 'Tiền Giang', lat: 10.36, lng: 106.36 },
  { id: 'ct-ninh-kieu', name: 'Bến Ninh Kiều', address: 'Ninh Kiều, Cần Thơ', province: 'Cần Thơ', lat: 10.0452, lng: 105.7469 },
];
