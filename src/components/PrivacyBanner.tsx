import React from 'react';
import { ShieldCheck } from 'lucide-react';

export const PrivacyBanner: React.FC = () => {
  return (
    <div className="privacy-banner fade-in">
      <ShieldCheck className="privacy-banner-icon" size={20} />
      <div>
        <strong>信息隐私安全保护：</strong>
        本服务采用纯客户端计算技术。您输入的所有日期、时区等参数，皆在您的浏览器本地进行计算，<strong>不经过任何网络传输，更不会上传至服务器</strong>，确保您的信息绝对隐私与安全。
      </div>
    </div>
  );
};
