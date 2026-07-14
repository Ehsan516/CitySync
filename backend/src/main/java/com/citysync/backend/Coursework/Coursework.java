package com.citysync.backend.coursework;

import com.citysync.backend.module.Module;
import jakarta.persistence.*;

import java.time.Instant;
import java.time.LocalDateTime;

@Entity
@Table(name = "coursework")
public class Coursework {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    //many coursework items can belong to one module like many to one relatsonship
    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "module_id", nullable = false)
    private Module module;

    @Column(nullable = false)
    private String title; //like "PDD submission"


    @Column(nullable = false)
    private LocalDateTime dueDate;  //submission date for planning

    //weighting (0-100% of module) optional but helps students
    private Integer weighting;

    @Column(nullable = false)
    private Instant createdAt = Instant.now();//when it was created

    @Column(nullable = false)
    private boolean completed = false;

    @Column(name = "score_percent")
    private java.math.BigDecimal scorePercent;

    @Column(nullable = false)
    private boolean onSite = false; //for onsite stuff like vivas

    private String location;//for route calc if in different location

    private Instant completedAt;

    protected Coursework() {
        // jpa needs a constructore with no args
    }

    public Coursework(Module module, String title, LocalDateTime dueDate, Integer weighting) {
        this.module = module;
        this.title = title;
        this.dueDate = dueDate;
        this.weighting = weighting;
    }

    //getters
    public Long getId() { return id; }
    public Module getModule() { return module; }
    public String getTitle() { return title; }
    public LocalDateTime getDueDate() { return dueDate; }
    public Integer getWeighting() { return weighting; }
    public Instant getCreatedAt() { return createdAt; }

    public boolean isCompleted() { return completed; }
    public Instant getCompletedAt() { return completedAt; }

    public java.math.BigDecimal getScorePercent(){ return scorePercent;}

    public boolean isOnSite(){return onSite;}

    public String getLocation() {return location;}

    //setters
    public void setTitle(String title) {
        this.title = title;
    }

    public void setDueDate(LocalDateTime dueDate) {
        this.dueDate = dueDate;
    }

    public void setWeighting(Integer weighting) {
        this.weighting = weighting;
    }

    public void setCompleted(boolean completed) {
        this.completed = completed;
        this.completedAt = completed ? Instant.now() : null;
    }

    public void setScorePercent(java.math.BigDecimal scorePercent) {
        this.scorePercent = scorePercent;
    }

    public void setOnSite(boolean onSite) {this.onSite = onSite;}
    public void setLocation(String location){this.location=location;}
}