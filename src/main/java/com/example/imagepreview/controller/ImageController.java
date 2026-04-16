package com.example.imagepreview.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;
import org.springframework.web.multipart.MultipartFile;

import javax.servlet.http.HttpSession;
import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;

@Controller
public class ImageController {

    @Value("${image.directory}")
    private String imageDirectory;

    private final ResourceLoader resourceLoader;

    public ImageController(ResourceLoader resourceLoader) {
        this.resourceLoader = resourceLoader;
    }

    // 登录页面
    @GetMapping("/login")
    public String login() {
        return "login";
    }
    
    // 测试页面，用于验证应用程序是否正常工作
    @GetMapping("/test")
    public String test() {
        System.out.println("=== 进入test方法 ===");
        return "test";
    }

    // 文件夹选择页面
    @GetMapping("/select-folder")
    public String selectFolder() {
        return "folder-selection";
    }
    
    // 直接选择文件夹页面（使用File System Access API）
    @GetMapping("/direct-select-folder")
    public String directSelectFolder() {
        return "direct-folder-selection";
    }
    
    // 直接预览页面（显示通过File System Access API选择的图片）
    @GetMapping("/direct-gallery")
    public String directGallery() {
        return "direct-gallery";
    }
   

    // 处理文件夹选择
    @PostMapping("/select-folder")
    public String handleFolderSelection(@RequestParam String folderPath, HttpSession session, RedirectAttributes redirectAttributes) {
        // 验证文件夹路径
        File dir = new File(folderPath);
        if (dir.exists() && dir.isDirectory()) {
            // 存储文件夹路径到会话
            session.setAttribute("selectedFolder", folderPath);
            return "redirect:/gallery";
        } else {
            // 文件夹无效，重定向回选择页面并显示错误
            redirectAttributes.addAttribute("error", true);
            return "redirect:/select-folder";
        }
    }

    // 图片画廊页面
    // 检查文件是否为图片文件
    private boolean isImageFile(String fileName) {
        String lowerCaseFileName = fileName.toLowerCase();
        return lowerCaseFileName.endsWith(".jpg") ||
               lowerCaseFileName.endsWith(".jpeg") ||
               lowerCaseFileName.endsWith(".png") ||
               lowerCaseFileName.endsWith(".gif") ||
               lowerCaseFileName.endsWith(".bmp") ||
               lowerCaseFileName.endsWith(".svg");
    }
    
    @GetMapping("/gallery")
    public String gallery(Model model, HttpSession session) {
        System.out.println("=== 进入gallery方法 ===");
        List<String> images = new ArrayList<>();
        
        try {
            String selectedFolder = (String) session.getAttribute("selectedFolder");
            if (selectedFolder == null) {
                selectedFolder = imageDirectory;
            }
            
            File folder = new File(selectedFolder);
            model.addAttribute("currentFolder", selectedFolder);
            
            if (folder.exists() && folder.isDirectory()) {
                File[] files = folder.listFiles();
                if (files != null) {
                    // 提高限制，Coverflow 处理 200 张左右依然很流畅
                    int maxImages = 300; 
                    int imageCount = 0;
                    
                    for (File file : files) {
                        if (file.isFile() && isImageFile(file.getName())) {
                            if (imageCount >= maxImages) break;
                            images.add(file.getName());
                            imageCount++;
                        }
                    }
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        
        model.addAttribute("images", images);
        
        // 智能切换逻辑
        if (images.size() > 10) {
            // 图片多时：使用高级 Coverflow 封面流
            return "gallery_coverflow"; 
        } else {
            // 图片少时：保持原有的 3D 轮盘 (gallery.html)
            return "gallery"; 
        }
    }    

    // 处理图片上传
    @PostMapping("/upload")
    public String uploadImage(@RequestParam("file") MultipartFile file,
                              HttpSession session,
                              RedirectAttributes redirectAttributes) {
        if (file.isEmpty()) {
            redirectAttributes.addFlashAttribute("message", "请选择一个文件");
            return "redirect:/gallery";
        }
        try {
            String currentFolder = (String) session.getAttribute("selectedFolder");
            if (currentFolder == null) {
                currentFolder = imageDirectory;
            }
            String fileName = file.getOriginalFilename();
            File dest = new File(currentFolder + File.separator + fileName);
            if (dest.exists()) {
                redirectAttributes.addFlashAttribute("error", "文件已存在: " + fileName);
                return "redirect:/gallery";
            }
            file.transferTo(dest);
            redirectAttributes.addFlashAttribute("message", "上传成功: " + fileName);
        } catch (IOException e) {
            e.printStackTrace();
            redirectAttributes.addFlashAttribute("error", "上传失败: " + e.getMessage());
        }
        return "redirect:/gallery";
    }

    // 处理图片删除(简单实现)
    @PostMapping("/delete")
    public String deleteImage(@RequestParam("filename") String filename, 
                              HttpSession session, 
                              RedirectAttributes redirectAttributes) {
        try {
            String currentFolder = (String) session.getAttribute("selectedFolder");
            if (currentFolder == null) {
                currentFolder = imageDirectory;
            }
            File file = new File(currentFolder + File.separator + filename);
            if (file.exists() && file.delete()) {
                redirectAttributes.addFlashAttribute("message", "删除成功");
            } else {
                redirectAttributes.addFlashAttribute("error", "删除失败或文件不存在");
            }
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("error", "删除出错");
        }
        return "redirect:/gallery";
    }

    // 提供图片文件的访问
    @GetMapping("/images/{filename}")
    public ResponseEntity<Resource> getImage(@PathVariable String filename, HttpSession session) throws IOException {
        // 从会话获取用户选择的文件夹路径，如果没有则使用默认路径
        String currentFolder = (String) session.getAttribute("selectedFolder");
        if (currentFolder == null) {
            currentFolder = imageDirectory;
        }
        
        // 构建图片文件路径
        String imagePath = currentFolder + File.separator + filename;
        
        // 加载图片资源
        Resource resource = resourceLoader.getResource("file:" + imagePath);
        
        // 获取图片文件的MIME类型
        String contentType = Files.probeContentType(Paths.get(imagePath));
        if (contentType == null) {
            contentType = "application/octet-stream";
        }
        
        return ResponseEntity.ok()
                .header("Content-Type", contentType)
                .body(resource);
    }
}

