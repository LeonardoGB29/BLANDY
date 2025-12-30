from django.shortcuts import render


def home(request):
    return render(request, "core/home.html")


def profile(request):
    return render(request, "core/profile.html")


def rooms(request):
    return render(request, "core/rooms.html")


def room(request):
    return render(request, "core/room.html")


def feedback(request):
    return render(request, "core/feedback.html")


def progress(request):
    return render(request, "core/progress.html")

