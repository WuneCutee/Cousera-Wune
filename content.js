
// Thông báo khi script được nạp vào trang web
console.log("Skipera Extension: Content script loaded.");

/**
 * Lắng nghe tin nhắn từ Background Script hoặc SidePanel
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    
    // Nếu yêu cầu là lấy thông tin trang web hiện tại
    if (request.type === 'get_page_info') {
        
        // Trả về URL và Tiêu đề của trang Coursera đang mở
        sendResponse({
            'url': window.location.href,
            'title': document.title
        });
    }

    // Trả về true để giữ cổng kết nối mở cho phản hồi bất đồng bộ (nếu cần)
    return true; 
});