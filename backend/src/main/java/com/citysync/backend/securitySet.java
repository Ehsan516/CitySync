package com.citysync.backend;
import org.springframework.context.annotation.Bean;//mark methods that produce beans
import org.springframework.context.annotation.Configuration;//makes class configuration for spring
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class securitySet {

    @Bean //security filter chain in spring container
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        //made public because failed bcs docs

        http
                .csrf(csrf -> csrf.disable())//for api and postman
                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))//no server session, api stays stateless
                .authorizeHttpRequests(auth -> auth.requestMatchers("/auth/**", "/health").permitAll()//public endpoints
                        .anyRequest().authenticated()//everything else needs auth
                )

//                .formLogin(form -> form.disable())
//                .httpBasic(basic -> basic.disable());//turn off auth popups
                .addFilterBefore(new UserIdAuthFilter(),//custom filter reads X-User-Id header
                        org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter.class

                );

        return http.build();//returns filter chain
    }

}