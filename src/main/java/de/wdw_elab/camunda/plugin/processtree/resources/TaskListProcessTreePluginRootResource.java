package de.wdw_elab.camunda.plugin.processtree.resources;

import javax.ws.rs.Path;

import org.camunda.bpm.tasklist.resource.AbstractTasklistPluginRootResource;

import de.wdw_elab.camunda.plugin.processtree.TaskListProcessTreePlugin;

@Path("plugin/" + TaskListProcessTreePlugin.ID)
public class TaskListProcessTreePluginRootResource extends AbstractTasklistPluginRootResource {

	public TaskListProcessTreePluginRootResource() {
		super(TaskListProcessTreePlugin.ID);
	}
}
