using MedicalAppointments.API.Models;
using Microsoft.EntityFrameworkCore;

namespace MedicalAppointments.API.Infrastructure;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User>             Users          { get; set; }
    public DbSet<TimeSlot>         TimeSlots      { get; set; }
    public DbSet<Appointment>      Appointments   { get; set; }
    public DbSet<WaitingListEntry> WaitingList    { get; set; }
    public DbSet<Notification>     Notifications  { get; set; }
    public DbSet<AuditLog>         AuditLogs      { get; set; }
    public DbSet<Service>          Services       { get; set; }
    public DbSet<DoctorService>    DoctorServices { get; set; }

    protected override void OnModelCreating(ModelBuilder mb)
    {
        // ── User ──────────────────────────────────────────────────────────
        mb.Entity<User>(e =>
        {
            e.HasIndex(u => u.Email).IsUnique();
            e.Property(u => u.Role).HasConversion<string>();
        });

        // ── TimeSlot ──────────────────────────────────────────────────────
        mb.Entity<TimeSlot>(e =>
        {
            e.Property(t => t.Status).HasConversion<string>();
            e.HasIndex(t => new { t.DoctorId, t.StartTime });
            e.HasOne(t => t.Doctor)
             .WithMany(u => u.TimeSlots)
             .HasForeignKey(t => t.DoctorId)
             .OnDelete(DeleteBehavior.Cascade);
            e.HasOne(t => t.Service)
             .WithMany()
             .HasForeignKey(t => t.ServiceId)
             .OnDelete(DeleteBehavior.SetNull);
        });
        // ── Appointment ───────────────────────────────────────────────────
        mb.Entity<Appointment>(e =>
        {
            e.Property(a => a.Status).HasConversion<string>();
            e.HasIndex(a => a.TimeSlotId).IsUnique();
            e.HasOne(a => a.TimeSlot)
             .WithOne(t => t.Appointment)
             .HasForeignKey<Appointment>(a => a.TimeSlotId);
            e.HasOne(a => a.Patient)
             .WithMany(u => u.Appointments)
             .HasForeignKey(a => a.PatientId)
             .OnDelete(DeleteBehavior.Restrict);
            e.HasOne(a => a.BookedBy)
             .WithMany()
             .HasForeignKey(a => a.BookedById)
             .OnDelete(DeleteBehavior.Restrict);
        });

        // ── WaitingListEntry ──────────────────────────────────────────────
        mb.Entity<WaitingListEntry>(e =>
        {
            e.ToTable("WaitingList");
            e.HasIndex(w => new { w.DoctorId, w.WeekStartDate, w.Email }).IsUnique();
            e.HasOne(w => w.Doctor)
             .WithMany()
             .HasForeignKey(w => w.DoctorId)
             .OnDelete(DeleteBehavior.Cascade);
        });

        // ── Notification ──────────────────────────────────────────────────
        mb.Entity<Notification>(e =>
        {
            e.Property(n => n.Status).HasConversion<string>();
        });

        // ── Service ───────────────────────────────────────────────────────
        mb.Entity<Service>(e =>
        {
            e.HasIndex(s => s.Name).IsUnique();
        });

        // ── DoctorService (table de liaison) ──────────────────────────────
        mb.Entity<DoctorService>(e =>
        {
            e.HasKey(ds => new { ds.DoctorId, ds.ServiceId });
            e.HasOne(ds => ds.Doctor)
             .WithMany()
             .HasForeignKey(ds => ds.DoctorId)
             .OnDelete(DeleteBehavior.Cascade);
            e.HasOne(ds => ds.Service)
             .WithMany(s => s.DoctorServices)
             .HasForeignKey(ds => ds.ServiceId)
             .OnDelete(DeleteBehavior.Cascade);
        });
    }
}
