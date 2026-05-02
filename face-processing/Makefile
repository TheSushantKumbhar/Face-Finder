dev:
	uv run fastapi dev --port 6969 &\
	uv run -m workers.face_worker & \
	uv run -m workers.selfie_worker & \
	wait

server:
	uv run fastapi dev --port 6969

face_worker:
	uv run -m workers.face_worker

selfie_worker:
	uv run -m workers.selfie_worker

setup:
	uv sync
