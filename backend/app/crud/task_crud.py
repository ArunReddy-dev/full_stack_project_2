from app.database.mysql_connection import get_connection
from app.schemas.schemas import TaskSchema
from app.models.models import TaskReqRes
from sqlalchemy.exc import SQLAlchemyError
from fastapi import HTTPException
from datetime import datetime, timezone


def add_task(new_task: TaskReqRes,role,user):
	session = None
	try:
		if role != "Admin" and role != "Manager":
			raise HTTPException(status_code=400,detail="Not Authorized")
		session = get_connection()
		task = TaskSchema(
			title=new_task.title,
			description=new_task.description,
			assigned_to=new_task.assigned_to,
   			assigned_by=new_task.assigned_by,
			assigned_at=new_task.assigned_at,
			updated_by=new_task.updated_by,
			updated_at=new_task.updated_at, 
			priority=new_task.priority,
			# use the status value provided by the request (expects 'to_do', 'in_progress', 'review', 'done')
			status=new_task.status,
			reviewer=new_task.reviewer,
   			created_by=user.e_id,
      		expected_closure=new_task.expected_closure,
			actual_closure=new_task.actual_closure
		)
		if task.assigned_to :
			task.assigned_at = datetime.now()
		session.add(task)
		session.commit()
		session.refresh(task)
		return TaskReqRes.model_validate(task)
	except SQLAlchemyError as e:
		if session:
			session.rollback()
		raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
	finally:
		if session:
			session.close()

def get_all_tasks(role,user):
	session = None
	try:
		session = get_connection()
		if role == "Manager":
			# Allow Managers to view all tasks in the "All Tasks" section.
			# Previously this returned only tasks where reviewer == manager. Change to return all tasks
			# for Manager role so managers can inspect and manage tasks across the board.
			if "Manager" in user.roles:
				tasks = session.query(TaskSchema).all()
			else:
				raise HTTPException(status_code=403,detail="Not Authorized")
		elif role=="Admin" :
			if "Admin" in user.roles:
				tasks=session.query(TaskSchema).all()
			else:
				raise HTTPException(status_code=403,detail="Not Authorized")
		else:
			if role in user.roles:
				tasks=session.query(TaskSchema).filter(TaskSchema.assigned_to==user.e_id).all()
			else:
				raise HTTPException(status_code=403,detail="Not Authorized")
		return [TaskReqRes.model_validate(t) for t in tasks]
	except SQLAlchemyError as e:
		if session:
			session.rollback()
		raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
	finally:
		if session:
			session.close()

def get_task_by_id(t_id: int):
	session = None
	try:
		session = get_connection()
		t = session.query(TaskSchema).filter(TaskSchema.t_id == t_id).first()
		if not t:
			raise HTTPException(status_code=404, detail="Task Not Found")
		return TaskReqRes.model_validate(t)
	except SQLAlchemyError as e:
		if session:
			session.rollback()
		raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
	finally:
		if session:
			session.close()

def get_task_by_status(status,role,user):
    try:
        data=get_all_tasks(role,user)
        new_data = [task for task in data if task.status == status]
        return new_data
    except SQLAlchemyError as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

def update_task(t_id: int, updated: dict, role,user):
	session = None
	try:
		if role != "Admin" and role != "Manager":
			raise HTTPException(status_code=403,detail="Not Authorized")

		session = get_connection()
		t = session.query(TaskSchema).filter(TaskSchema.t_id == t_id).first()
		if not t:
			raise HTTPException(status_code=404, detail="Task Not Found")

		# handle assignment timestamp
		if "assigned_to" in updated and updated.get("assigned_to") and not t.assigned_at:
			t.assigned_at = datetime.now()

		# handle status -> enforce rules and set actual_closure when moved to DONE
		if "status" in updated:
			new_status = updated.get("status")
			if new_status:
				# Normalize to upper for comparisons
				ns = str(new_status).upper()
				# If manager is trying to mark as DONE, ensure they're the reviewer
				if ns == "DONE":
					# Only set actual_closure when moving to done
					t.actual_closure = datetime.now()
					if role == "Manager":
						if user.e_id != t.reviewer:
							raise HTTPException(status_code=403, detail="Only the reviewer can mark the task as Done")
				# Prevent non-assigned users from changing IN_PROGRESS tasks to something else via update
				if t.status and str(t.status).upper() == "IN_PROGRESS":
					# Only assigned employee should be moving IN_PROGRESS -> REVIEW via patch endpoint; disallow via update
					raise HTTPException(status_code=403,detail="Only assigned employee can change the status of a task in progress")

		for key, value in updated.items():
			setattr(t, key, value)

		t.updated_at = datetime.now()
		session.commit()
		session.refresh(t)
		return TaskReqRes.model_validate(t)
	except SQLAlchemyError as e:
		if session:
			session.rollback()
		raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
	finally:
		if session:
			session.close()

def patch_status(t_id,status,role,user):

	try:
		session = get_connection()
		t = session.query(TaskSchema).filter(TaskSchema.t_id == t_id).first()
		if role == "Manager":
			if user.e_id != t.reviewer:
				raise HTTPException(status_code=403, detail="Not Reviewer for the task")
			if (status.upper() == "IN_PROGRESS" or status.upper() == "DONE") and t.status.upper() == "REVIEW":
				t.status = status
			else:
				raise HTTPException(status_code=409, detail="Only change the status to in progress or done from status review")
		else:
			if user.e_id != t.assigned_to:
				raise HTTPException(status_code=403, detail="Not assigned for the task")
			# Assigned employee can move TO_DO -> IN_PROGRESS and IN_PROGRESS -> REVIEW
			if status.upper() == "IN_PROGRESS" and t.status.upper() == "TO_DO":
				t.status = status
			elif status.upper() == "REVIEW" and t.status.upper() == "IN_PROGRESS":
				t.status = status
			else:
				raise HTTPException(status_code=409, detail="Only change the status from To Do -> In Progress or In Progress -> Review")

		session.commit()
		session.refresh(t)
		return TaskReqRes.model_validate(t)
	except SQLAlchemyError as e:
		if session:
			session.rollback()
		raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
	finally:
		if session:
			session.close()


def delete_task(role,user,t_id: int):
	session = None
	try:
		if role != "Admin" and role != "Manager":
			raise HTTPException(status_code=403,detail="Not Authorized")
		t = session.query(TaskSchema).filter(TaskSchema.t_id == t_id).first()

		session = get_connection()
		if user.e_id != t.created_by:
			raise HTTPException(status_code=403,detail="Not Authorized to delete the task")
		
		if not t:
			raise HTTPException(status_code=404, detail="Task Not Found")

		session.delete(t)
		session.commit()
		return {"detail": "Task Deleted Successfully"}

	except SQLAlchemyError as e:
		if session:
			session.rollback()
		raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

	finally:
		if session:
			session.close()