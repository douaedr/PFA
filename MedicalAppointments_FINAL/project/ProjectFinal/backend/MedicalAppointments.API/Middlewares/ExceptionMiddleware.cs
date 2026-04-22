using System.Net;
using System.Text.Json;

namespace MedicalAppointments.API.Middlewares;

public class ExceptionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionMiddleware> _logger;

    public ExceptionMiddleware(RequestDelegate next, ILogger<ExceptionMiddleware> logger)
    {
        _next   = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext ctx)
    {
        try
        {
            await _next(ctx);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Exception non gérée : {Message}", ex.Message);
            await HandleExceptionAsync(ctx, ex);
        }
    }

    private static Task HandleExceptionAsync(HttpContext ctx, Exception ex)
    {
        int statusCode = ex switch
        {
            KeyNotFoundException        => (int)HttpStatusCode.NotFound,
            UnauthorizedAccessException => (int)HttpStatusCode.Forbidden,
            InvalidOperationException   => (int)HttpStatusCode.BadRequest,
            ArgumentException           => (int)HttpStatusCode.BadRequest,
            _                           => (int)HttpStatusCode.InternalServerError
        };

        ctx.Response.ContentType = "application/json";
        ctx.Response.StatusCode  = statusCode;

        var payload = JsonSerializer.Serialize(new
        {
            status  = statusCode,
            message = ex.Message,
            type    = ex.GetType().Name
        }, new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase });

        return ctx.Response.WriteAsync(payload);
    }
}
