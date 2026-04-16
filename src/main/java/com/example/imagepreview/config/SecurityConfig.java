package com.example.imagepreview.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.provisioning.InMemoryUserDetailsManager;
import org.springframework.security.crypto.password.NoOpPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .authorizeRequests()
                .antMatchers("/login", "/select-folder", "/gallery", "/images/**", "/css/**", "/test", "/direct-select-folder", "/direct-gallery", "/sounds/**").permitAll()  // 允许访问登录页面、文件夹选择页面、gallery页面、图片资源、测试页面和静态资源
                .anyRequest().authenticated()  // 其他所有请求需要认证
                .and()
            .formLogin()
                .loginPage("/login")  // 自定义登录页面
                .loginProcessingUrl("/login")  // 登录表单提交的URL
                .usernameParameter("username")  // 登录表单的用户名字段名称
                .passwordParameter("password")  // 登录表单的密码字段名称
                .defaultSuccessUrl("/gallery", true)  // 登录成功后跳转的页面
                .permitAll()
                .and()
            .logout()
                .logoutUrl("/logout")
                .logoutSuccessUrl("/login?logout=true")  // 登出成功后跳转的页面
                .invalidateHttpSession(true)
                .deleteCookies("JSESSIONID")
                .permitAll()
                .and()
            .csrf().disable(); // 暂时禁用CSRF保护以便测试

        return http.build();
    }

    @Bean
    public UserDetailsService userDetailsService() {
        // 创建内存用户，密码为123456（使用明文密码测试）
        UserDetails user = User.builder()
            .username("admin")
            .password("123456")
            .roles("USER")
            .build();

        return new InMemoryUserDetailsManager(user);
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        // 使用NoOpPasswordEncoder进行测试（接受明文密码）
        return NoOpPasswordEncoder.getInstance();
    }
}
