export type BankOption = {
  code: string;
  shortName: string;
  name: string;
  logo: string;
};

export const VIETNAM_BANKS: BankOption[] = [
  { code: "ABB", shortName: "ABBANK", name: "Ngân hàng TMCP An Bình", logo: "https://cdn.vietqr.io/img/ABB.png" },
  { code: "ACB", shortName: "ACB", name: "Ngân hàng TMCP Á Châu", logo: "https://cdn.vietqr.io/img/ACB.png" },
  { code: "VBA", shortName: "Agribank", name: "Ngân hàng Nông nghiệp và Phát triển Nông thôn Việt Nam", logo: "https://cdn.vietqr.io/img/VBA.png" },
  { code: "BAB", shortName: "BacABank", name: "Ngân hàng TMCP Bắc Á", logo: "https://cdn.vietqr.io/img/BAB.png" },
  { code: "BVB", shortName: "BaoVietBank", name: "Ngân hàng TMCP Bảo Việt", logo: "https://cdn.vietqr.io/img/BVB.png" },
  { code: "BIDV", shortName: "BIDV", name: "Ngân hàng TMCP Đầu tư và Phát triển Việt Nam", logo: "https://cdn.vietqr.io/img/BIDV.png" },
  { code: "CAKE", shortName: "CAKE", name: "TMCP Việt Nam Thịnh Vượng - Ngân hàng số CAKE by VPBank", logo: "https://cdn.vietqr.io/img/CAKE.png" },
  { code: "CBB", shortName: "CBBank", name: "Ngân hàng Thương mại TNHH MTV Xây dựng Việt Nam", logo: "https://cdn.vietqr.io/img/CBB.png" },
  { code: "CIMB", shortName: "CIMB", name: "Ngân hàng TNHH MTV CIMB Việt Nam", logo: "https://cdn.vietqr.io/img/CIMB.png" },
  { code: "CITIBANK", shortName: "Citibank", name: "Ngân hàng Citibank, N.A. - Chi nhánh Hà Nội", logo: "https://cdn.vietqr.io/img/CITIBANK.png" },
  { code: "COOPBANK", shortName: "COOPBANK", name: "Ngân hàng Hợp tác xã Việt Nam", logo: "https://cdn.vietqr.io/img/COOPBANK.png" },
  { code: "DBS", shortName: "DBSBank", name: "DBS Bank Ltd - Chi nhánh Thành phố Hồ Chí Minh", logo: "https://cdn.vietqr.io/img/DBS.png" },
  { code: "EIB", shortName: "Eximbank", name: "Ngân hàng TMCP Xuất Nhập khẩu Việt Nam", logo: "https://cdn.vietqr.io/img/EIB.png" },
  { code: "GPB", shortName: "GPBank", name: "Ngân hàng Thương mại TNHH MTV Dầu Khí Toàn Cầu", logo: "https://cdn.vietqr.io/img/GPB.png" },
  { code: "HDB", shortName: "HDBank", name: "Ngân hàng TMCP Phát triển Thành phố Hồ Chí Minh", logo: "https://cdn.vietqr.io/img/HDB.png" },
  { code: "HLBVN", shortName: "HongLeong", name: "Ngân hàng TNHH MTV Hong Leong Việt Nam", logo: "https://cdn.vietqr.io/img/HLBVN.png" },
  { code: "HSBC", shortName: "HSBC", name: "Ngân hàng TNHH MTV HSBC (Việt Nam)", logo: "https://cdn.vietqr.io/img/HSBC.png" },
  { code: "IVB", shortName: "IndovinaBank", name: "Ngân hàng TNHH Indovina", logo: "https://cdn.vietqr.io/img/IVB.png" },
  { code: "KBank", shortName: "KBank", name: "Ngân hàng Đại chúng TNHH Kasikornbank", logo: "https://cdn.vietqr.io/img/KBANK.png" },
  { code: "KEBHANAHCM", shortName: "KEBHanaHCM", name: "Ngân hàng KEB Hana – Chi nhánh Thành phố Hồ Chí Minh", logo: "https://cdn.vietqr.io/img/KEBHANAHCM.png" },
  { code: "KEBHANAHN", shortName: "KEBHANAHN", name: "Ngân hàng KEB Hana – Chi nhánh Hà Nội", logo: "https://cdn.vietqr.io/img/KEBHANAHN.png" },
  { code: "KLB", shortName: "KienLongBank", name: "Ngân hàng TMCP Kiên Long", logo: "https://cdn.vietqr.io/img/KLB.png" },
  { code: "KBHCM", shortName: "KookminHCM", name: "Ngân hàng Kookmin - Chi nhánh Thành phố Hồ Chí Minh", logo: "https://cdn.vietqr.io/img/KBHCM.png" },
  { code: "KBHN", shortName: "KookminHN", name: "Ngân hàng Kookmin - Chi nhánh Hà Nội", logo: "https://cdn.vietqr.io/img/KBHN.png" },
  { code: "LPB", shortName: "LPBank", name: "Ngân hàng TMCP Lộc Phát Việt Nam", logo: "https://cdn.vietqr.io/img/LPB.png" },
  { code: "MB", shortName: "MBBank", name: "Ngân hàng TMCP Quân đội", logo: "https://cdn.vietqr.io/img/MB.png" },
  { code: "MBV", shortName: "MBV", name: "Ngân hàng TNHH MTV Việt Nam Hiện Đại", logo: "https://cdn.vietqr.io/img/MBV.png" },
  { code: "NAB", shortName: "NamABank", name: "Ngân hàng TMCP Nam Á", logo: "https://cdn.vietqr.io/img/NAB.png" },
  { code: "NCB", shortName: "NCB", name: "Ngân hàng TMCP Quốc Dân", logo: "https://cdn.vietqr.io/img/NCB.png" },
  { code: "NHB HN", shortName: "Nonghyup", name: "Ngân hàng Nonghyup - Chi nhánh Hà Nội", logo: "https://cdn.vietqr.io/img/NHB.png" },
  { code: "OCB", shortName: "OCB", name: "Ngân hàng TMCP Phương Đông", logo: "https://cdn.vietqr.io/img/OCB.png" },
  { code: "PGB", shortName: "PGBank", name: "Ngân hàng TMCP Thịnh vượng và Phát triển", logo: "https://cdn.vietqr.io/img/PGB.png" },
  { code: "PBVN", shortName: "PublicBank", name: "Ngân hàng TNHH MTV Public Việt Nam", logo: "https://cdn.vietqr.io/img/PBVN.png" },
  { code: "PVCB", shortName: "PVcomBank", name: "Ngân hàng TMCP Đại Chúng Việt Nam", logo: "https://cdn.vietqr.io/img/PVCB.png" },
  { code: "PVDB", shortName: "PVcomBank Pay", name: "Ngân hàng TMCP Đại Chúng Việt Nam Ngân hàng số", logo: "https://cdn.vietqr.io/img/PVCB.png" },
  { code: "STB", shortName: "Sacombank", name: "Ngân hàng TMCP Sài Gòn Thương Tín", logo: "https://cdn.vietqr.io/img/STB.png" },
  { code: "SGICB", shortName: "SaigonBank", name: "Ngân hàng TMCP Sài Gòn Công Thương", logo: "https://cdn.vietqr.io/img/SGICB.png" },
  { code: "SCB", shortName: "SCB", name: "Ngân hàng TMCP Sài Gòn", logo: "https://cdn.vietqr.io/img/SCB.png" },
  { code: "SEAB", shortName: "SeABank", name: "Ngân hàng TMCP Đông Nam Á", logo: "https://cdn.vietqr.io/img/SEAB.png" },
  { code: "SHB", shortName: "SHB", name: "Ngân hàng TMCP Sài Gòn - Hà Nội", logo: "https://cdn.vietqr.io/img/SHB.png" },
  { code: "SHBVN", shortName: "ShinhanBank", name: "Ngân hàng TNHH MTV Shinhan Việt Nam", logo: "https://cdn.vietqr.io/img/SHBVN.png" },
  { code: "SCVN", shortName: "StandardChartered", name: "Ngân hàng TNHH MTV Standard Chartered Bank Việt Nam", logo: "https://cdn.vietqr.io/img/SCVN.png" },
  { code: "TCB", shortName: "Techcombank", name: "Ngân hàng TMCP Kỹ thương Việt Nam", logo: "https://cdn.vietqr.io/img/TCB.png" },
  { code: "TIMO", shortName: "Timo", name: "Ngân hàng số Timo by Ban Viet Bank (Timo by Ban Viet Bank)", logo: "https://vietqr.net/portal-service/resources/icons/TIMO.png" },
  { code: "TPB", shortName: "TPBank", name: "Ngân hàng TMCP Tiên Phong", logo: "https://cdn.vietqr.io/img/TPB.png" },
  { code: "Ubank", shortName: "Ubank", name: "TMCP Việt Nam Thịnh Vượng - Ngân hàng số Ubank by VPBank", logo: "https://cdn.vietqr.io/img/UBANK.png" },
  { code: "UOB", shortName: "UnitedOverseas", name: "Ngân hàng United Overseas - Chi nhánh TP. Hồ Chí Minh", logo: "https://cdn.vietqr.io/img/UOB.png" },
  { code: "VBSP", shortName: "VBSP", name: "Ngân hàng Chính sách Xã hội", logo: "https://cdn.vietqr.io/img/VBSP.png" },
  { code: "VAB", shortName: "VietABank", name: "Ngân hàng TMCP Việt Á", logo: "https://cdn.vietqr.io/img/VAB.png" },
  { code: "VIETBANK", shortName: "VietBank", name: "Ngân hàng TMCP Việt Nam Thương Tín", logo: "https://cdn.vietqr.io/img/VIETBANK.png" },
  { code: "VCCB", shortName: "VietCapitalBank", name: "Ngân hàng TMCP Bản Việt", logo: "https://cdn.vietqr.io/img/VCCB.png" },
  { code: "VCB", shortName: "Vietcombank", name: "Ngân hàng TMCP Ngoại Thương Việt Nam", logo: "https://cdn.vietqr.io/img/VCB.png" },
  { code: "ICB", shortName: "VietinBank", name: "Ngân hàng TMCP Công thương Việt Nam", logo: "https://cdn.vietqr.io/img/ICB.png" },
  { code: "Vikki", shortName: "Vikki", name: "Ngân hàng TNHH MTV Số Vikki", logo: "https://cdn.vietqr.io/img/Vikki.png" },
  { code: "VPB", shortName: "VPBank", name: "Ngân hàng TMCP Việt Nam Thịnh Vượng", logo: "https://cdn.vietqr.io/img/VPB.png" },
  { code: "VRB", shortName: "VRB", name: "Ngân hàng Liên doanh Việt - Nga", logo: "https://cdn.vietqr.io/img/VRB.png" },
  { code: "WVN", shortName: "Woori", name: "Ngân hàng TNHH MTV Woori Việt Nam", logo: "https://cdn.vietqr.io/img/WVN.png" },
];

export function normalizeBankName(value: string) {
  const trimmed = value?.trim();
  if (!trimmed) return "";

  const lower = trimmed.toLowerCase();
  const compact = lower.replace(/\s+/g, "");

  const direct = VIETNAM_BANKS.find((bank) => {
    const shortLower = bank.shortName.toLowerCase();
    const nameLower = bank.name.toLowerCase();
    const codeLower = bank.code.toLowerCase();
    return (
      shortLower === lower ||
      nameLower === lower ||
      codeLower === lower ||
      shortLower.replace(/\s+/g, "") === compact ||
      nameLower.replace(/\s+/g, "") === compact ||
      codeLower.replace(/\s+/g, "") === compact
    );
  });

  return direct?.shortName || trimmed;
}
