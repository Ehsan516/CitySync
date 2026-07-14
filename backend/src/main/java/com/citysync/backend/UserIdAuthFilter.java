package com.citysync.backend;

import jakarta.servlet.FilterChain;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;

/**reads userId header sent by app on every authenticated req
 * if present and numeric, marks the request as authenticated in Spring Securit */
public class UserIdAuthFilter extends OncePerRequestFilter {


    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {

        String path = request.getServletPath();
        return path.startsWith("/auth/") || path.equals("/health");
    }
    @Override
    protected void doFilterInternal(HttpServletRequest request,HttpServletResponse response,FilterChain chain)
            throws ServletException, IOException {

        String header = request.getHeader("X-User-Id");

        if (header != null && !header.isBlank()) {
            try {

                long userId = Long.parseLong(header.trim());
                //set as auth principal
                UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(userId, null, Collections.emptyList());
                SecurityContextHolder.getContext().setAuthentication(auth);
            } catch (NumberFormatException ignored) {

                //invalid header fall through, req stays unauthenticated
            }
        }

        chain.doFilter(request, response);
    }
}
