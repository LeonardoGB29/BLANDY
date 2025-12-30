from django.urls import path

from . import views

app_name = "core"

urlpatterns = [
    path("", views.home, name="home"),
    path("perfil/", views.profile, name="profile"),
    path("salas/", views.rooms, name="rooms"),
    path("sala/", views.room, name="room"),
    path("feedback/", views.feedback, name="feedback"),
    path("progreso/", views.progress, name="progress"),
]

