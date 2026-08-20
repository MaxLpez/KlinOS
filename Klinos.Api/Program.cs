using Klinos.Api.Data;
using Klinos.Api.Hubs;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// 1. Agregamos los servicios básicos
builder.Services.AddControllers();
builder.Services.AddSignalR(); 

// 2. CONFIGURACIÓN DE CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("PermitirReact", policy =>
    {
        policy.WithOrigins("http://localhost:5173") 
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

// 3. CONFIGURACIÓN DE SEGURIDAD (JWT)
var jwtKey = builder.Configuration["Jwt:Key"];
var keyBytes = Encoding.UTF8.GetBytes(jwtKey!);

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(keyBytes),
            RoleClaimType = "rol"

        };
        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                // Extraemos el token de la URL
                var accessToken = context.Request.Query["access_token"];

                // Si la petición va dirigida al chatHub y trae un token, lo inyectamos
                var path = context.HttpContext.Request.Path;
                if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/chatHub"))
                {
                    // Le pasamos el token a la validación de C#
                    context.Token = accessToken;
                }
                return Task.CompletedTask;
            }
        };
    });

// 4. Conexión a la Base de Datos
builder.Services.AddDbContext<KlinosDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

var app = builder.Build();

// ==========================================
// EL ORDEN DE ESTAS LÍNEAS ES CRÍTICO
// ==========================================

app.UseCors("PermitirReact");

// 5. Autenticación SIEMPRE va antes que Autorización
app.UseAuthentication(); 
app.UseAuthorization();

// 6. Rutas
app.MapControllers();
app.MapHub<ChatHub>("/chatHub");

app.Run();