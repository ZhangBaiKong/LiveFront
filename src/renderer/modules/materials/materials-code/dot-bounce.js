export default {
  "css": ".bounce-demo {\n  display: flex;\n  gap: 40px;\n  align-items: center;\n  padding: 20px;\n}\n\n.bounce-dots {\n  display: flex;\n  gap: 6px;\n}\n\n.bounce-dot {\n  width: 12px;\n  height: 12px;\n  background: #3b82f6;\n  border-radius: 50%;\n  animation: bounce 1.4s ease-in-out infinite;\n}\n\n.bounce-dot:nth-child(1) { animation-delay: -0.32s; }\n.bounce-dot:nth-child(2) { animation-delay: -0.16s; }\n\n@keyframes bounce {\n  0%, 80%, 100% { transform: translateY(0); }\n  40% { transform: translateY(-16px); }\n}",
  "html": "<div class=\"bounce-demo\">\n  <div class=\"bounce-dots\">\n    <div class=\"bounce-dot\"></div>\n    <div class=\"bounce-dot\"></div>\n    <div class=\"bounce-dot\"></div>\n  </div>\n</div>"
};
